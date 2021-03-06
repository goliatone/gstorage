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
}(this, 'gstorage', ['extend'], function(extend) {

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
        hashLength: 32,
        storeKey: '_GST',
        storeID: '_gstore_default_',
        autoinitialize: true,
        storeFactory: function(config) {
            //Use NullStore
            return new IndexedStore(config);
        },
        makeStoreId: function() {
            return this.storeKey + '.' + window.location.hostname;
        }
    };

    /**
     * GStorage constructor
     *
     * @param  {object} config Configuration object.
     */
    var GStorage = function(config) {
        config = config || {};

        config = _extend({}, this.constructor.DEFAULTS, config);

        if (config.makeStoreId) config.storeID = config.makeStoreId();

        if (config.autoinitialize) this.init(config);
    };

    GStorage.name = GStorage.prototype.name = 'GStorage';

    GStorage.VERSION = '0.0.0';

    /**
     * Make default options available so we
     * can override.
     */
    GStorage.DEFAULTS = OPTIONS;

    GStorage.use = function(ext) {
        _extend(GStorage.prototype, ext);
    };

    ///////////////////////////////////////////////////
    // PRIVATE METHODS
    ///////////////////////////////////////////////////

    GStorage.prototype.init = function(config) {
        if (this.initialized) return this.logger.warn('Already initialized');
        this.initialized = true;

        console.log('GStorage: Init!');
        _extend(this, config);

        this.store = this.buildStore(config);

        return this;
    };

    GStorage.prototype.buildStore = function(config) {
        var store = this.storeFactory(config);

        if (typeof store.setOwner === 'function') store.setOwner(this);

        store.onError = this.onError.bind(this);
        store.onSuccess = this.onSuccess.bind(this);
        store.onConnected = this.onConnected.bind(this);

        return store;
    };

    GStorage.prototype.onError = function(e) {
        this.logger.error(e);
    };

    GStorage.prototype.onConnected = function(e) {
        this.logger.info('On connected', e, this);
        this.emit('connected');
    };

    GStorage.prototype.onSuccess = function(e) {
        this.logger.info('On success', e, this);
        this.emit('success', e);
    };

    ////////////////////////////////////////////
    /// DATA ACCESSSOR MEHTODS
    ///
    ////////////////////////////////////////////
    GStorage.prototype.get = function(key, def) {
        return this.store.get(key, def);
    };

    GStorage.prototype.set = function(key, value) {
        return this.store.set(key, value).then(function() {
            this.emit('change', {
                key: key,
                action: 'set',
                value: value
            });
        }.bind(this));
    };

    GStorage.prototype.del = function(key) {
        return this.store.del(key).then('success', function(result) {
            this.emit('change', {
                key: key,
                action: 'delete',
                value: result
            });
        }.bind(this));
    };

    GStorage.prototype.key = function(key) {
        //TODO: Do we want to transform key?
        return key;
    };

    ////////////////////////////////////////////
    /// STORE DELEGATE METHODS
    ///
    ////////////////////////////////////////////

    //TODO: This might now make sense
    GStorage.prototype.clear = function() {
        return this.store.clear();
    };
    //TODO: This might now make sense
    GStorage.prototype.purge = function() {
        var args = Array.prototype.slice.call(arguments);
        this.store.purge(args);
        return this;
    };
    //TODO: This might now make sense
    GStorage.prototype.setTTL = function(key, time) {
        throw new Error('TODO: This needs to be implemented!!!');
    };

    ////////////////////////////////////////////
    /// UTILITY METHODS
    ///
    ////////////////////////////////////////////
    GStorage.prototype.now = function() {
        //Unix timestamp
        return new Date().getTime() / 1000 | 0;
    };

    /**
     * Get Date from timestamp
     * @param  {int} t  Unit timestamp.
     * @return {Date}   Date
     */
    GStorage.prototype.dateFromTimestamp = function(t) {
        //From unit timestamp to date.
        return new Date(parseInt(t) * 1000);
    };

    GStorage.prototype.hash = function(key) {
        var hash2 =
            hash1 = (5381 << 16) + 5381,
            pos = 0;
        while (pos < key.length) {
            hash1 = ((hash1 << 5) + hash1 + (hash1 >> 27)) ^ key.charCodeAt(pos);
            if (pos == key.length - 1) break;
            hash2 = ((hash2 << 5) + hash2 + (hash2 >> 27)) ^ key.charCodeAt(pos + 1);
            pos += 2;
        }

        return (hash1 + (hash2 * 1566083941)).toString();
    };

    /**
     * Logger method, meant to be implemented by
     * mixin. As a placeholder, we use console if available
     * or a shim if not present.
     */
    GStorage.prototype.logger = _shimConsole(console);

    /**
     * PubSub emit method stub.
     */
    GStorage.prototype.emit = function() {
        this.logger.warn(GStorage, 'emit method is not implemented', arguments);
    };

    return GStorage;
}));