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

    var options = {
        autoinitialize: true
    };

    /**
     * GlobalStore constructor
     *
     * @param  {object} config Configuration object.
     */
    var GlobalStore = function(config) {
        config = config || {};

        config = _extend({}, this.constructor.DEFAULTS, config);

        if (config.autoinitialize) this.init(config);
    };

    GlobalStore.name = GlobalStore.prototype.name = 'GlobalStore';

    GlobalStore.VERSION = '0.0.0';

    /**
     * Make default options available so we
     * can override.
     */
    GlobalStore.DEFAULTS = options;

    GlobalStore.use = function(ext) {
        _extend(GlobalStore.prototype, ext);
    };

    ///////////////////////////////////////////////////
    // PRIVATE METHODS
    ///////////////////////////////////////////////////

    GlobalStore.prototype.init = function(config) {
        if (this.initialized) return this.logger.warn('Already initialized');
        this.initialized = true;

        console.log('GlobalStore: Init!');
        _extend(this, config);

        this.store = this.createDriver();

        return this;
    };

    //TODO: Move this method to options.
    GlobalStore.prototype.createDriver = function() {
        this.domain || (this.domain = window.location.hostname);
        this.store = window.globalStorage[this.domain];
    };

    //TODO: We want to have this to be at the Plugin
    //level, so we do can check without initialization.
    GlobalStore.prototype.supported = function() {
        var supported = true;
        try {
            window.globalStorage[window.location.hostname];
        } catch (e) {
            supported = false;
        }
        return supported;
    };

    GlobalStore.prototype.onError = function(e) {
        this.logger.error('ERROR:', e);
        this.emit('error', e);
    };

    GlobalStore.prototype.onSuccess = function(xxx, results) {

    };

    ////////////////////////////////////////////
    /// DATA ACCESSSOR MEHTODS
    ///
    ////////////////////////////////////////////
    GlobalStore.prototype.get = function(key, def) {
        return this.has(key) ? this.getSerializedValue(key) : def;
    };

    GlobalStore.prototype.getSerializedValue = function(key) {
        var value = this.store.getItem(key);

        if (typeof value !== 'string') return value;

        try {
            value = JSON.parse(value);
        } catch (E) {
            this.logger.warn('Error parsing value for key', key);
            return undefined;
        }
        return value;
    };

    GlobalStore.prototype.set = function(key, value) {
        if (value !== 'string') value = JSON.stringify(value);
        this.store.setItem(key, value);
        return this;
    };

    GlobalStore.prototype.del = function(key) {
        this.store.removeItem(key);
        return this;
    };

    GlobalStore.prototype.has = function(key) {
        return this.store.getItem(key) !== null;
    };

    GlobalStore.prototype.key = function(key) {
        //TODO: Do we want to transform key?
        return key;
    };

    ////////////////////////////////////////////
    /// STORE DELEGATE METHODS
    ///
    ////////////////////////////////////////////
    GlobalStore.prototype.maxSize = function() {
        // 5 MB per origin in Google Chrome, Mozilla
        // Firefox, and Opera; 10 MB per storage
        // area in Internet Explorer. Should we bother?
        return -1;
    };

    GlobalStore.prototype.size = function() {
        return this.store.length;
    };

    GlobalStore.prototype.clear = function() {
        return this.store.clear();
        return this;
    };

    GlobalStore.prototype.purge = function() {
        for (var i = this.store.length - 1; i >= 0; i--) {
            if (this.store.key(i).indexOf(this.storeKey) !== -1) {
                this.store.removeItem(this.store.key(i));
            }
        }
    };

    GlobalStore.prototype.setTTL = function(key, time) {
        throw new Error('TODO: This needs to be implemented!!!');
    };

    ////////////////////////////////////////////
    /// UTILITY METHODS
    ///
    ////////////////////////////////////////////




    /**
     * Logger method, meant to be implemented by
     * mixin. As a placeholder, we use console if available
     * or a shim if not present.
     */
    GlobalStore.prototype.logger = _shimConsole(console);

    /**
     * PubSub emit method stub.
     */
    GlobalStore.prototype.emit = function() {
        this.logger.warn(GlobalStore, 'emit method is not implemented', arguments);
    };

    return GlobalStore;
}));