/*
 * promiseddb
 * https://github.com/goliatone/promiseddb
 * Created with gbase.
 * Copyright (c) 2014 goliatone
 * Licensed under the MIT license.
 */
/* jshint strict: false, plusplus: true */
/*global define: false, require: false, module: false, exports: false */
(function(root, name, deps, factory) {
    "use strict";
    // Node
    if (typeof deps === 'function') {
        factory = deps;
        deps = [];
    }

    if (typeof exports === 'object') {
        module.exports = factory.apply(root, deps.map(require));
    } else if (typeof define === 'function' && 'amd' in define) {
        //require js, here we assume the file is named as the lower
        //case module name.
        define(name.toLowerCase(), deps, factory);
    } else {
        // Browser
        var d, i = 0,
            global = root,
            old = global[name],
            mod;
        while ((d = deps[i]) !== undefined) deps[i++] = root[d];
        global[name] = mod = factory.apply(global, deps);
        //Export no 'conflict module', aliases the module.
        mod.noConflict = function() {
            global[name] = old;
            return mod;
        };
    }
}(this, 'promiseddb', ['extend'], function(extend) {

    /**
     * Extend method.
     * @param  {Object} target Source object
     * @return {Object}        Resulting object from
     *                         meging target to params.
     */
    var _extend = extend;

    /**
     * Shim console, make sure that if no console
     * available calls do not generate errors.
     * @return {Object} Console shim.
     */
    var _shimConsole = function(con) {

        if (con) return con;

        con = {};
        var empty = {},
            noop = function() {},
            properties = 'memory'.split(','),
            methods = ('assert,clear,count,debug,dir,dirxml,error,exception,group,' +
                'groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,' +
                'table,time,timeEnd,timeStamp,trace,warn').split(','),
            prop,
            method;

        while (method = methods.pop()) con[method] = noop;
        while (prop = properties.pop()) con[prop] = empty;

        return con;
    };



    ///////////////////////////////////////////////////
    // CONSTRUCTOR
    ///////////////////////////////////////////////////

    var OPTIONS = {
        autoconnect:true,
        autoinitialize: true,
        delay: 200,
        maxTries: 5,
        version: 1.0,
        storeId:'_GST_',
        database: '_gstore_default_',
        defineSchema:function() {}
    };

    /**
     * PromisedDB constructor
     *
     * @param  {object} config Configuration object.
     */
    var PromisedDB = function(config) {
        config = config || {};

        config = _extend({}, this.constructor.DEFAULTS, config);

        if (config.autoinitialize) this.init(config);
    };

    PromisedDB.name = PromisedDB.prototype.name = 'PromisedDB';

    PromisedDB.VERSION = '0.0.0';

    /**
     * Make default options available so we
     * can override.
     */
    PromisedDB.DEFAULTS = OPTIONS;


    ///////////////////////////////////////////////////
    // PRIVATE METHODS
    ///////////////////////////////////////////////////

    PromisedDB.prototype.init = function(config) {
        if (this.initialized) return this.logger.warn('Already initialized');
        this.initialized = true;

        console.log('PromisedDB: Init!');
        _extend(this, config);

        if (!config || !config.version || !config.database) {
            throw new Error('Invalid arg! Specify database and version');
        }

        this.tries = 0;
        this.queue = [];

        // Use a vendor specific IndexedDB object.
        this.db = indexedDB || mozIndexedDB || webkitIndexedDB || msIndexedDB;

        if (config.autoconnect) this.connect();

        return this;
    };

    PromisedDB.prototype.connect = function() {

        var req = this.db.open(this.database, this.version);
        /**
         * Since this is an event, e is an Event object
         * that holds the indexed PromisedDB object.
         */
        req.onsuccess = function(e) {
            this.tries = 0;
            this.connection = e.target.result;
            this.onConnected();
            this.flushQueue();
        };

        // If connection cannot be made to database.
        req.onerror = function(e) {
            if (++this.tries < this.maxTries) {
                setTimeout(this.connect.bind(this), this.delay);
            } else {
                this.onError(e);
            }
        };

        // This will run if our database is new.
        req.onupgradeneeded = function(e) {
            var connection = e.target.result;
            this.defineSchema.apply(connection);
        };

        req.onerror = req.onerror.bind(this);
        req.onsuccess = req.onsuccess.bind(this);
        req.onupgradeneeded = req.onupgradeneeded.bind(this);

    };

    PromisedDB.prototype.flushQueue = function() {
        var reduce = function(last, args) {
            this.resolveTransaction.apply(this, args);
        }.bind(this);
        var out = this.queue.reduce(reduce, []);
        this.queue = [];
    };

    /**
     * Resolve transaction and provide results to caller
     */
    PromisedDB.prototype.resolveTransaction = function(storeId, commit, resolve, reject) {
        var commands = [],
            transaction = this.connection.transaction(storeId, 'readwrite');

        /*
         * We pass the results to the resolve method.
         * Available as an argument in the `then` method!
         * `query` is actually the IDBRequest returned by
         *  `indexedbd.transaction`
         */
        var execute = function(storeId, request) {
            commands.push(new Promise(function(rs, rj) {
                console.warn('command execute', storeId, request);
                request.onerror = rj;
                request.onsuccess = function(data) {
                    console.warn('success')
                    rs({
                        for: storeId,
                        result: data.target.result
                    });
                };
            }));
        };

        try {
            /*
             * Execute commit in transaction scope.
             */
            commit.call(transaction, execute);
        } catch (e) {
            reject(e);
        }

        Promise.all(commands)
            .then(function(values) {
                /*
                 * Iterate over all promised results and collapse
                 * to a single object.
                 */
                var result = values.reduce(function(output, resolved) {
                    output[resolved.for] = resolved.result;
                    return output;
                }, {});
                resolve(result);
            });
    };

    /**
     * Add transaction info to queue for when database is available
     */
    PromisedDB.prototype.queueTransaction = function(storeId, query, resolve, reject) {
        this.queue.push([].slice.call(arguments, 0));
    };

    PromisedDB.prototype.use = function(storeId, query) {
        this.storeId = storeId;
        //query here is a transaction callback.
        var executor = function(resolve, reject) {
            if (this.connection) {
                this.resolveTransaction(storeId, query, resolve, reject);
            } else {
                this.queueTransaction(storeId, query, resolve, reject);
            }
        };
        executor = executor.bind(this);

        return new Promise(executor);
    };

    PromisedDB.prototype.query = function(query) {
        return this.use(this.storeId, query);
    };

    PromisedDB.prototype.onConnected = function() {
        this.logger.info('BD connected');
    };

    PromisedDB.prototype.onError = function(e) {
        this.logger.error('ERROR:', e);
    };

    /**
     * Logger method, meant to be implemented by
     * mixin. As a placeholder, we use console if available
     * or a shim if not present.
     */
    PromisedDB.prototype.logger = _shimConsole(console);

    /**
     * PubSub emit method stub.
     */
    PromisedDB.prototype.emit = function() {
        this.logger.warn(PromisedDB, 'emit method is not implemented', arguments);
    };

    return PromisedDB;
}));