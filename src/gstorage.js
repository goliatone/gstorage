/*
 * gstorage.js
 * https://github.com/goliatone/gstorage
 *
 * Copyright (c) 2013 goliatone
 * Licensed under the MIT license.
 */
/* jshint strict: false, plusplus: true */
/*global define: false, require: false, module: false, exports: false */
(function (root, name, deps, factory) {
    "use strict";
    // Node
     if(typeof deps === 'function') { 
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
        var d, i = 0, global = root, old = global[name], mod;
        while((d = deps[i]) !== undefined) deps[i++] = root[d];
        global[name] = mod = factory.apply(global, deps);
        //Export no 'conflict module', aliases the module.
        mod.noConflict = function(){
            global[name] = old;
            return mod;
        };
    }

}(this, "GStorage", ['jquery'], function($) {

///////////////////////////////////////////////////
// CONSTRUCTOR
///////////////////////////////////////////////////
	
	var options = {
        purgeKey : '_g#$_'
    };
    
    /**
     * GStorage constructor
     * 
     * @param  {object} config Configuration object.
     */
    var GStorage = function(config){
        $.extend(this, options, config || {});
        this.options = config;
        this.init();
    };

    var o = $({}), _l = {};
    var _a = function(e){ (e in _l) || (_l[e] = 0); _l[e] += 1; };
    var _d = function(e){ (e in _l) && (_l[e] -= 1); };

    GStorage.prototype.on    = function() { o.on.apply(o,  arguments); _a(arguments[0]); return this;};
    GStorage.prototype.off   = function() { o.off.apply(o, arguments); _d(arguments[0]); return this;};
    GStorage.prototype.emit  = function() { o.trigger.apply(o, arguments); return this;};
    GStorage.prototype.emits = function(e){ return (e in _l && _l[e] > 0);};

///////////////////////////////////////////////////
// PUBLIC METHODS
///////////////////////////////////////////////////

    GStorage.prototype.init = function(){
        this.store = new LocalStore();
        this.store.init(this.options);
    };

    GStorage.prototype.use = function(ext){
        $.extend(GConfig.prototype, ext);
        return this;
    };

    GStorage.prototype.maxSize = function(){
        return this.store.maxSize();
    };

    GStorage.prototype.size = function(){
        return this.store.size();
    };

    GStorage.prototype.get = function(key, def){
        return this.store.get(key, def);
    };

    GStorage.prototype.set = function(key, value){
        var old = this.store.get(key, null);
        this.store.set(key, value);
        //TODO: if(this.willtrigger('change'))
        this.emit('change', key, old, value);
        return this;
    };

    GStorage.prototype.del = function(key){
        var old = this.store.get(key, null);
        this.store.del(key);
        this.emit('change', key, old);
        return this;
    };

    GStorage.prototype.has = function(key){
        return this.store.has(key);
    };

    GStorage.prototype.key = function(key){
        return key;
    };

    GStorage.prototype.purge = function(){
        this.store.purge();
        return this;
    };

    GStorage.prototype.clear = function(){
        this.store.clear();
        return this;
    };

    GStorage.prototype.setTTL = function(key, time){

    };

////////////////////////////////////////////////////
// Driver: NullStore
////////////////////////////////////////////////////

    var NullStore = function(){};
    var methods = ['init', 'supported', 'size', 'maxSize', 'get', 'set', 'del', 'has', 'purge', 'clear'];
    for(var p in methods) NullStore.prototype[methods[p]] = function(){};
    
    var LocalStore = function(config){};


////////////////////////////////////////////////////
// DRIVERS
// http://dev.w3.org/html5/webstorage/#the-sessionstorage-attribute
// https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Storage?redirectlocale=en-US&redirectslug=Web%2FGuide%2FDOM%2FStorage
////////////////////////////////////////////////////


////////////////////////////////////////////////////
// Driver: LocalStore
// Firefox 3.5
////////////////////////////////////////////////////

    LocalStore.prototype.init = function(config){
        $.extend(this, config || {});
        this.config = config;
        this.store = window.localStorage;
    };

    LocalStore.prototype.supported = function(){
        var success = true;
        try {
            var value = Math.random();
            this.store.setItem(value, value);
            this.store.removeItem(value);
        } catch (e) {
            success = false;
        }
        
        return success;
    };

    LocalStore.prototype.maxSize = function(){
        return -1;
    };

    LocalStore.prototype.size = function(){
        return this.store.length;
    };

    LocalStore.prototype.get = function(key, def){
        // 'undefined' === typeof def && def=null;
        return this.has(key) ? this.store.getItem(key) : def;
    };

    LocalStore.prototype.set = function(key, value){
        this.store.setItem( key , value );
    };

    LocalStore.prototype.del = function(key){
        this.store.removeItem(key);
    };

    LocalStore.prototype.has = function(key){
        return this.store.getItem(key) !== null;
    };

    LocalStore.prototype.purge = function(){
        for ( var i = this.store.length - 1; i >= 0; i-- ) {
            if (this.store.key(i).indexOf(this.purgeKey) !== -1 ) {
                this.store.removeItem(this.store.key(i));
            }
        }
    };

    LocalStore.prototype.clear = function(){
        this.store.clear();
    };

////////////////////////////////////////////////////
// Driver: GlobalStore
// Obsolete since Gecko 13.0 (Firefox 13.0 / Thunderbird 13.0 / SeaMonkey 2.10)
////////////////////////////////////////////////////
    
    GlobalStore.prototype.init = function(config){
        $.extend(this, config || {});
        ('domain' in config)  || (config.domain = window.location.hostname);
        this.config = config;
        this.store = window.globalStorage[this.config.domain];
    };

    GlobalStore.prototype.supported = function(){
        var success = true;
        try {
            var store =  window.globalStorage[window.location.hostname];
        } catch(){
            success = false;
        }
        
        return success;
    };

    GlobalStore.prototype.maxSize = function(){
        return -1;
    };

    GlobalStore.prototype.size = function(){
        return localStorage.length;
    };

    GlobalStore.prototype.get = function(key, def){
        // 'undefined' === typeof def && def=null;
        return this.has(key) ? localStorage.getItem(key) : def;
    };

    GlobalStore.prototype.set = function(key, value){
        localStorage.setItem( key , value );
    };

    GlobalStore.prototype.del = function(key){
        localStorage.removeItem(key);
    };

    GlobalStore.prototype.has = function(key){
        return localStorage.getItem(key) !== null;
    };

    GlobalStore.prototype.purge = function(){
        for ( var i = localStorage.length - 1; i >= 0; i-- ) {
            if ( localStorage.key(i).indexOf(this.purgeKey) !== -1 ) {
                localStorage.removeItem(localStorage.key(i));
            }
        }
    };

    GlobalStore.prototype.clear = function(){
        localStorage.clear();
    };

    return GStorage;
}));