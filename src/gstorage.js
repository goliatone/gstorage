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
console.log('hjere', $);

///////////////////////////////////////////////////
// CONSTRUCTOR
///////////////////////////////////////////////////
	
	var options = {
        
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

    var o = $({});
    GStorage.prototype.on   = function() { o.on.apply(o, arguments); return this;};
    GStorage.prototype.off  = function() { o.off.apply(o, arguments); return this;};
    GStorage.prototype.emit = function() { o.trigger.apply(o, arguments); return this;};

///////////////////////////////////////////////////
// PRIVATE METHODS
///////////////////////////////////////////////////

    GStorage.prototype.init = function(){
        console.log('GStorage: Init!');
        return 'This is just a stub!';
    };
    return GStorage;
}));