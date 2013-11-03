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
        this.options = options;
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
        this.store = new LocalStorage();
        this.store.init(this.options);
    };

    GStorage.prototype.use = function(ext){
        $.extend(GConfig.prototype, ext);
        return this;
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

    var NullStorage = function(){};
    var methods = ['init', 'supported', 'size', 'get', 'set', 'del', 'has', 'purge', 'clear'];
    for(var p in methods) NullStorage.prototype[methods[p]] = function(){};
    
    var LocalStorage = function(config){
        $.extend(this, config || {});
    };

    LocalStorage.prototype.init = function(config){
        $.extend(this, config || {});
    };

    LocalStorage.prototype.supported = function(){
        var success = true;
        try {
            var value = Math.random();
            storage.setItem(value, value);
            storage.removeItem(value);
        } catch (e) {
            success = false;
        }
        
        return success;
    };

    LocalStorage.prototype.size = function(){
        return localStorage.length;
    };

    LocalStorage.prototype.get = function(key, def){
        // 'undefined' === typeof def && def=null;
        return this.has(key) ? localStorage.getItem(key) : def;
    };

    LocalStorage.prototype.set = function(key, value){
        localStorage.setItem( key , value );
    };

    LocalStorage.prototype.del = function(key){
        localStorage.removeItem(key);
    };

    LocalStorage.prototype.has = function(key){
        return localStorage.getItem(key) !== null;
    };

    LocalStorage.prototype.purge = function(){
        for ( var i = localStorage.length - 1; i >= 0; i-- ) {
            if ( localStorage.key(i).indexOf(this.purgeKey) !== -1 ) {
                localStorage.removeItem(localStorage.key(i));
            }
        }
    };

    LocalStorage.prototype.clear = function(){
        localStorage.clear();
    };


    return GStorage;
}));