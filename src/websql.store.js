/*
 * gstorage
 * https://github.com/goliatone/gstorage
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
}(this, 'websqlstore', ['extend'], function(extend) {

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

    var options = {
        autoinitialize: true
    };

    /**
     * WebSQLStore constructor
     *
     * @param  {object} config Configuration object.
     */
    var WebSQLStore = function(config) {
        config = config || {};

        config = _extend({}, this.constructor.DEFAULTS, config);

        if (config.autoinitialize) this.init(config);
    };

    WebSQLStore.name = WebSQLStore.prototype.name = 'WebSQLStore';

    WebSQLStore.VERSION = '0.0.0';

    /**
     * Make default options available so we
     * can override.
     */
    WebSQLStore.DEFAULTS = options;

    WebSQLStore.use = function(ext) {
        _extend(WebSQLStore.prototype, ext);
    };

    ///////////////////////////////////////////////////
    // PRIVATE METHODS
    ///////////////////////////////////////////////////

    WebSQLStore.prototype.init = function(config) {
        if (this.initialized) return this.logger.warn('Already initialized');
        this.initialized = true;

        console.log('WebSQLStore: Init!', config);
        _extend(this, config);

        //Assert: storeID and hashLength!!!

        this.store = this.createDriver();

        var sql = ['CREATE TABLE IF NOT EXISTS #storeID#',
                ' (id NVARCHAR(#hashLength#) UNIQUE PRIMARY KEY,',
                ' key TEXT,',
                ' value TEXT,',
                ' timestamp REAL)'
            ].join('\n')
            .replace('#storeID#', this.storeID)
            .replace('#hashLength#', this.hashLength);

        var args = [];
        this.store.transaction(function(t) {
            console.log('SQL', sql, args)
            t.executeSql(sql, args);
        }, this._onConnect.bind(this));

        return this;
    };

    //TODO: Move this method to options.
    WebSQLStore.prototype.createDriver = function() {
        return openDatabase(this.storeID, '1.0.0', this.storeID, 5 * 1024 * 1024);
    };

    WebSQLStore.prototype.onError = function(e) {
        this.logger.error('ERROR:', e);
        this.emit('error', e);
    };

    WebSQLStore.prototype._onConnect = function(e) {
        this.logger.info('ON CONNECT', arguments);
    };

    WebSQLStore.prototype.onSuccess = function(xxx, results) {
        console.log('ON SUCCESS')
    };

    ////////////////////////////////////////////
    /// DATA ACCESSSOR MEHTODS
    ///
    ////////////////////////////////////////////
    WebSQLStore.prototype.get = function(key, def) {
        var args = [key];
        var sql = 'SELECT * FROM #storeID# WHERE key=?';
        sql = sql.replace('#storeID#', this.storeID);
        return this.store.transaction(function(transaction) {
            console.info('SQL', sql);
            transaction.executeSql(sql, args);
        });
    };

    WebSQLStore.prototype.set = function(key, value) {
        var old = this.get(key, null);

        if (typeof value !== 'string') value = JSON.stringify(value);

        var timestamp = this.timestamp();
        var sql = 'INSERT or REPLACE INTO #storeID# (key, value, timestamp) values (?,?,?)';
        sql = sql.replace('#storeID#', this.storeID);

        var args = [key, value, timestamp];

        this.store.transaction(function(transaction) {
            console.info('SQL', sql, args);
            transaction.executeSql(sql, args);
        }, this.onSuccess.bind(this), this.onError.bind(this));

        //TODO: We should formalize bindable model
        //change event payload
        this.emit('change', {
            key: key,
            old: old,
            value: value
        });
        return this;
    };

    WebSQLStore.prototype.del = function(key) {
        var old = this.store.get(key, null);

        this.store.del(key);

        this.emit('change', {
            key: key,
            old: old,
            value: null
        });

        return this;
    };

    WebSQLStore.prototype.has = function(key) {
        return this.store.has(key);
    };

    WebSQLStore.prototype.key = function(key) {
        //TODO: Do we want to transform key?
        return key;
    };

    ////////////////////////////////////////////
    /// STORE DELEGATE METHODS
    ///
    ////////////////////////////////////////////
    WebSQLStore.prototype.maxSize = function() {
        return this.store.maxSize();
    };

    WebSQLStore.prototype.size = function() {
        return this.store.size();
    };

    WebSQLStore.prototype.clear = function() {
        return this.store.clear();
        return this;
    };

    WebSQLStore.prototype.purge = function() {
        var args = Array.prototype.slice.call(arguments);
        this.store.purge(args);
        return this;
    };

    WebSQLStore.prototype.setTTL = function(key, time) {
        throw new Error('TODO: This needs to be implemented!!!');
    };

    ////////////////////////////////////////////
    /// UTILITY METHODS
    ///
    ////////////////////////////////////////////

    WebSQLStore.prototype.timestamp = function() {
        //Unix timestamp
        return new Date().getTime() / 1000 | 0;
    };



    /**
     * Logger method, meant to be implemented by
     * mixin. As a placeholder, we use console if available
     * or a shim if not present.
     */
    WebSQLStore.prototype.logger = _shimConsole(console);

    /**
     * PubSub emit method stub.
     */
    WebSQLStore.prototype.emit = function() {
        this.logger.warn(WebSQLStore, 'emit method is not implemented', arguments);
    };

    return WebSQLStore;
}));