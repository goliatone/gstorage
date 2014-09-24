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
}(this, 'indexedstore', ['extend', 'promiseddb'], function(extend, PromisedDB) {

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
     * IndexedStore constructor
     *
     * @param  {object} config Configuration object.
     */
    var IndexedStore = function(config) {
        config = config || {};

        config = _extend({}, this.constructor.DEFAULTS, config);

        if (config.autoinitialize) this.init(config);
    };

    IndexedStore.name = IndexedStore.prototype.name = 'IndexedStore';

    IndexedStore.VERSION = '0.0.0';

    /**
     * Make default options available so we
     * can override.
     */
    IndexedStore.DEFAULTS = options;

    IndexedStore.use = function(ext) {
        _extend(IndexedStore.prototype, ext);
    };

    ///////////////////////////////////////////////////
    // PRIVATE METHODS
    ///////////////////////////////////////////////////

    IndexedStore.prototype.init = function(config) {
        if (this.initialized) return this.logger.warn('Already initialized');
        this.initialized = true;

        console.log('IndexedStore: Init!');
        _extend(this, config);

        this.store = this.createDriver();

        this.store.onError = this.onError.bind(this);

        return this;
    };

    //TODO: Move this method to options.
    IndexedStore.prototype.createDriver = function() {
        var notify = this.onCreated.bind(this);
        var db = new PromisedDB({
            defineSchema:function(){
                var tableID = this.storeID;
                this.createObjectStore(tableID, {keyPath: 'key'});
            }
        });

        return db;
    };

    //TODO: Move this to IndexedStore.supported!
    IndexedStore.prototype.supported = function() {
       return PromisedDB.supported();
    };

    IndexedStore.prototype.onError = function(e) {
        this.logger.error('ERROR:', e);
        this.emit('error', e);
    };

    IndexedStore.prototype.onCreated = function(){
        this.logger.info('IndexedStore created');
    }
    IndexedStore.prototype.onConnected = function() {
        this.logger.info('on ready')
    };

    IndexedStore.prototype.onSuccess = function(xxx, results) {
        this.logger.info('onSuccess');
    };

    ////////////////////////////////////////////
    /// DATA ACCESSSOR MEHTODS
    ///
    ////////////////////////////////////////////
    IndexedStore.prototype.get = function(key, def) {
        var storeID = this.storeID;
        return this.store.with(storeID, function(execute){
            execute(this.objectStore(storeID)
                    .get(key));
        });
    };

    IndexedStore.prototype.set = function(key, value) {
        var storeID = this.storeID;
        var object = {
            key: key,
            value: value,
            timestamp: this.timestamp()
        };
        return this.store.with(storeID, function(execute){
            execute(this.objectStore(storeID)
                    .put(object));
        });


    };

    IndexedStore.prototype.del = function(key) {
        var storeID = this.storeID;
        return this.store.with(storeID, function(execute){
            execute(this.objectStore(storeID)
                    .get(key));
        });
    };

    IndexedStore.prototype.has = function(key) {
        //TODO: This does not make sense in async mode?
        return this.store.has(key);
    };

    IndexedStore.prototype.key = function(key) {
        //TODO: Do we want to transform key?
        return key;
    };

    ////////////////////////////////////////////
    /// STORE DELEGATE METHODS
    ///
    ////////////////////////////////////////////
    IndexedStore.prototype.maxSize = function() {
        return this.store.maxSize();
    };

    IndexedStore.prototype.size = function() {
        return this.store.size();
    };

    IndexedStore.prototype.clear = function() {
        return this.store.clear();
        return this;
    };

    IndexedStore.prototype.purge = function() {
        var args = Array.prototype.slice.call(arguments);
        this.store.purge(args);
        return this;
    };

    IndexedStore.prototype.setTTL = function(key, time) {
        throw new Error('TODO: This needs to be implemented!!!');
    };

    ////////////////////////////////////////////
    /// UTILITY METHODS
    ///
    ////////////////////////////////////////////

    IndexedStore.prototype.timestamp = function() {
        //Unix timestamp
        return new Date().getTime() / 1000 | 0;
    };


    /**
     * Logger method, meant to be implemented by
     * mixin. As a placeholder, we use console if available
     * or a shim if not present.
     */
    IndexedStore.prototype.logger = _shimConsole(console);

    /**
     * PubSub emit method stub.
     */
    IndexedStore.prototype.emit = function() {
        this.logger.warn(IndexedStore, 'emit method is not implemented', arguments);
    };

    return IndexedStore;
}));