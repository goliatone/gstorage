'use strict';
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
}(this, 'localstore', ['extend'], function(extend) {

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
        autoinitialize: true,
        getDriver: function() {
            return window.localStorage;
        }
    };

    /**
     * LocalStore constructor
     *
     * @param  {object} config Configuration object.
     */
    var LocalStore = function(config) {
        config = config || {};

        config = _extend({}, this.constructor.DEFAULTS, config);

        if (config.autoinitialize) this.init(config);
    };

    //LocalStore.name =
    LocalStore.prototype.name = 'LocalStore';

    LocalStore.VERSION = '0.0.0';

    /**
     * Make default options available so we
     * can override.
     */
    LocalStore.DEFAULTS = OPTIONS;

    LocalStore.use = function(ext) {
        _extend(LocalStore.prototype, ext);
    };

    ///////////////////////////////////////////////////
    // PRIVATE METHODS
    ///////////////////////////////////////////////////

    LocalStore.prototype.init = function(config) {
        if (this.initialized) return this.logger.warn('Already initialized');
        this.initialized = true;

        console.log('LocalStore: Init!', config);
        _extend(this, config);

        this.store = this.createDriver();

        return this;
    };

    //TODO: Move this method to options.
    LocalStore.prototype.createDriver = function() {
        return this.getDriver();
    };

    //TODO: We want to have this to be at the Plugin
    //level, so we do can check without initialization.
    LocalStore.prototype.supported = function() {
        var supported = true;
        try {
            var value = Math.random();
            this.store.setItem(value, value);
            this.store.removeItem(value);
        } catch (e) {
            supported = false;
        }
        return supported;
    };

    LocalStore.prototype.onError = function(e) {
        this.logger.error('ERROR:', e);
        this.emit('error', e);
    };

    LocalStore.prototype.onSuccess = function(xxx, results) {
        this.logger.info('onSuccess', arguments);
    };

    ////////////////////////////////////////////
    /// DATA ACCESSSOR MEHTODS
    ///
    ////////////////////////////////////////////
    LocalStore.prototype.get = function(id, def) {
        var key = this.key(id),
            store = this.store;
        return new Promise(function(resolve, reject) {
            var value;
            try {
                value = store.getItem(key);
                value = JSON.parse(value);
            } catch (e) {
                reject(e)
            }
            resolve(value);
        });
    };

    LocalStore.prototype.set = function(id, value) {
        var key = this.key(id);
        var store = this.store;
        return new Promise(function(resolve, reject) {
            try {
                if (value !== 'string') value = JSON.stringify(value);
                store.setItem(key, value);
                //TODO: What do we send here!
                resolve(value);
            } catch (e) {
                reject(e);
            }
        });
    };

    LocalStore.prototype.del = function(id) {
        var key = this.key(id),
            store = this.store;
        return new Promise(function(resolve, reject) {
            this.store.removeItem(key);
            resolve(key);
        });
    };

    LocalStore.prototype.key = function(id) {
        //TODO: Do we want to transform key?
        return this.storeID + '.' + id;
    };

    ////////////////////////////////////////////
    /// STORE DELEGATE METHODS
    ///
    ////////////////////////////////////////////
    LocalStore.prototype.clear = function() {
        return this.store.clear();
    };

    LocalStore.prototype.purge = function() {
        for (var i = this.store.length - 1; i >= 0; i--) {
            if (this.store.key(i).indexOf(this.storeKey) !== -1) {
                this.store.removeItem(this.store.key(i));
            }
        }
    };

    LocalStore.prototype.setTTL = function(id, time) {
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
    LocalStore.prototype.logger = _shimConsole(console);

    /**
     * PubSub emit method stub.
     */
    LocalStore.prototype.emit = function() {
        this.logger.warn(LocalStore, 'emit method is not implemented', arguments);
    };

    return LocalStore;
}));