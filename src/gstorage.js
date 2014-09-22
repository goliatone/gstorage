/*
 * gstorage.js
 * https://github.com/goliatone/gstorage
 *
 * It depends on map, make sure we either have a shim or
 * we remove dependency.
 *
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
// TODO: Add inmemory store, to use as cache.
///////////////////////////////////////////////////
	
	var options = {
        //StoreKey should build storeID = storeKey + domain.
        //that way we can use the library in the same browser
        //in different websites without overriding stuff.
        storeKey : '_gst_'
    };
    
    /**
     * GStorage constructor
     * 
     * @param  {object} config Configuration object.
     */
    var GStorage = function(config){
        this.options = config || {};
        $.extend(this, options, this.options);        
        this.init();
    };

    var o = $({}), _l = {};
    var _a = function(e){ (e in _l) || (_l[e] = 0); _l[e] += 1; };
    var _d = function(e){ (e in _l) && (_l[e] -= 1); };
 
    GStorage.prototype.on    = function ( ) { o.on.apply(o,  arguments); _a(arguments[0]); return this;};
    GStorage.prototype.off   = function ( ) { o.off.apply(o, arguments); _d(arguments[0]); return this;};
    GStorage.prototype.emit  = function ( ) { o.trigger.apply(o, arguments); return this;};
    GStorage.prototype.once  = function ( ) { o.one.apply(o, arguments); return this;}
    GStorage.prototype.emits = function (e) { return (e in _l && _l[e] > 0);};

///////////////////////////////////////////////////
// PUBLIC METHODS
///////////////////////////////////////////////////

    GStorage.prototype.init = function(){
        //We want each domain to have it's own store        
        this.storeID    = this.storeKey + window.location.hostname;
        // this.hashLength = this.hash('sample').toString().length;
        this.hashLength = 32;

        //TODO: Figure out a better way to send config.
        this.options.now = this.now;
        this.options.hash = this.hash;
        this.options.storeID = this.storeID;
        this.options.hashLength = this.hashLength;

        this.store = new WebSQLStore();        
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
        //TODO: Do we want to transform key?
        return key;
    };

    GStorage.prototype.now = function(){        
        //Unix timestamp        
        return new Date().getTime() / 1000 | 0;
    };

    /**
     * Get Date from timestamp
     * @param  {int} t  Unit timestamp.
     * @return {Date}   Date
     */
    GStorage.prototype.dateFromTimestamp = function(t){
        //From unit timestamp to date.
        return new Date(parseInt(t) * 1000);
    };

    GStorage.prototype.hash = function(key){
        var hash2 = 
            hash1 = (5381<<16) + 5381,
            pos   = 0;    
        while(pos < key.length) {
            hash1 = ((hash1 << 5) + hash1 + (hash1 >> 27)) ^ key.charCodeAt(pos);
            if( pos == key.length - 1) break;
            hash2 = ((hash2 << 5) + hash2 + (hash2 >> 27)) ^ key.charCodeAt(pos + 1);
            pos += 2;
        }

        return (hash1 + (hash2 * 1566083941)).toString();
    };

    /**
     * Remove selected keys. It takes a variable
     * number of keys.
     *     
     * @return {GStorage} Chainable method
     */
    GStorage.prototype.purge = function(){
        var args = Array.prototype.slice.call(arguments);
        this.store.purge(args);
        return this;
    };

    /**
     * Clears the store.
     * @return {GStorage} Chainable method
     */
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
    for(var p in methods) NullStore.prototype[methods[p]] = function(){return false;};   
    NullStore.prototype.supported = function(){return true;}
    NullStore.prototype.get = function(key, def){return def;}
    NullStore.prototype.has = function(key){return false;}

////////////////////////////////////////////////////
// DRIVERS
// http://dev.w3.org/html5/webstorage/#the-sessionstorage-attribute
// https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Storage?redirectlocale=en-US&redirectslug=Web%2FGuide%2FDOM%2FStorage
////////////////////////////////////////////////////

////////////////////////////////////////////////////
// Driver: sqlLite
// Firefox 3.5
////////////////////////////////////////////////////
    
    var WebSQLStore = function(config){};
    WebSQLStore.prototype.init = function(config){
        //TODO: We should ensure that we get the config
        //      options that we need!
        $.extend(this, config || {});
        this.config = config;       
        
        //name -> version -> description -> size
        //           openDatabaseSync
        this.store = openDatabase(this.name, '1.0.0', this.name, 65536);
        
        var sql = ['CREATE TABLE IF NOT EXISTS #storeID#',
                      ' (id NVARCHAR(#hashLength#) UNIQUE PRIMARY KEY,',
                      ' key TEXT,',
                      ' value TEXT,',
                      ' timestamp REAL)'
                     ].join('\n')
                      .replace('#storeID#', this.storeID)
                      .replace('#hashLength#', this.hashLength);

        var args = [];
        console.log('init ', sql);
        this.store.transaction(function (t) { 
            t.executeSql(sql, args);
        }, this.onSuccess, this.onError);
    };

    WebSQLStore.prototype.onError = function(){
        console.log('ON ERROR: ', arguments);
    };

    WebSQLStore.prototype.onSuccess = function(xxx, results){
        console.log('ON SUCCESS: ', results);
        var out = [];
        for(var i =0, l = results.rows.length; i < l; i++){
            out.push(results.rows.item(i));
        }
        console.log(out);
    };

    WebSQLStore.prototype.supported = function(){
        return ('openDatabase' in window);
    };

    WebSQLStore.prototype.maxSize = function(){
        return -1;
    };

    WebSQLStore.prototype.size = function(){
        return -1;
    };

    WebSQLStore.prototype.get = function(key, def){
        var sql = ['SELECT * FROM #storeID#',
                   ' WHERE id = ?'
                  ].join('\n')
                  .replace('#storeID#', this.storeID);

        var id   = this.hash(key),
            self = this,
            args = [id];
        console.log('get ', sql, args);
        this.store.transaction(function(t){
            t.executeSql(sql, args, self.onSuccess, self.onError );
        });
    };

    WebSQLStore.prototype.set = function(key, value){
        var sql = ['INSERT OR REPLACE INTO #storeID#',
                   ' (id, key, value, timestamp)',
                   ' VALUES (?,?,?,?)'
                   ].join('\n')
                    .replace('#storeID#', this.storeID);

        var id   = this.hash(key),
            now  = this.now( ),
            self = this,
            args = [id, key, value, now];
        console.log('set ', sql, args);
        this.store.transaction(function(t){
            t.executeSql(sql, args, self.onSuccess, self.onError);
        });
    };

    WebSQLStore.prototype.del = function(key){
         var sql = ['DELETE * FROM #storeID#',
                   ' WHERE id = ?'
                  ].join('\n')
                  .replace('#storeID#', this.storeID);

        var id   = this.hash(key),
            args = [id],
            self = this;
        console.log('del ', sql, args);
        this.store.transaction(function(t){
            t.executeSql(sql, args, self.onError, self.onSuccess);
        });
    };

    WebSQLStore.prototype.has = function(key){
        var sql = ['SELECT * FROM #storeID#',
                   ' WHERE id = ?'
                  ].join('\n')
                  .replace('#storeID#', this.storeID);

        var id   = this.hash(key),
            self = this,
            args = [id],
            onSuccess = function(x, results){
                var has = (results.rows.length > 0);
                console.log('we has: ', key, has);
            };
        console.log('has ', sql, args);
        this.store.transaction(function(t){
            t.executeSql(sql, args, onSuccess, self.onError);
        });
    };

    WebSQLStore.prototype.purge = function(keys){
        
        var args = [],
            self = this;

        var idList = function(keys, args){
            if(typeof keys === 'string'){
                args.push(self.hash(keys));
                return '= ?';
            }
            args = keys.map(self.hash);
            return 'IN ('+Array(keys.length).join('?,') + '?)';
        };

        var sql = ['SELECT * FROM #storeID#',
                   ' WHERE id #idList#'
                  ].join('\n')
                  .replace('#idList#', idList(keys, args))
                  .replace('#storeID#', this.storeID);
        

        this.store.transaction(function(t){
            t.executeSql(sql, args, onSuccess, self.onError );
        });
    };

    WebSQLStore.prototype.clear = function(){
        var sql = ['SELECT * FROM #storeID#'
                  ].join('\n')
                  .replace('#storeID#', this.storeID);
        var args = [];

        this.store.transaction(function(t){
            t.executeSql(sql, args, onSuccess, self.onError );
        });
    };

////////////////////////////////////////////////////
// Driver: LocalStore
// Firefox 3.5
////////////////////////////////////////////////////
//{ LocalStore    
    var LocalStore = function(config){};

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
            if (this.store.key(i).indexOf(this.storeKey) !== -1 ) {
                this.store.removeItem(this.store.key(i));
            }
        }
    };

    LocalStore.prototype.clear = function(){
        this.store.clear();
    };
//}

////////////////////////////////////////////////////
// Driver: GlobalStore
// Obsolete since Gecko 13.0 (Firefox 13.0 / Thunderbird 13.0 / SeaMonkey 2.10)
////////////////////////////////////////////////////
//{  GlobalStore
    var GlobalStore = function(config){};

    GlobalStore.prototype.init = function(config){
        $.extend(this, config || {});
        ('domain' in config)  || (config.domain = window.location.hostname);
        this.config = config;
        this.store = window.globalStorage[this.config.domain];
    };

    GlobalStore.prototype.supported = function(){
        var success = true;
        try {
            window.globalStorage[window.location.hostname];
        } catch(e) {
            success = false;
        }
        
        return success;
    };

    GlobalStore.prototype.maxSize = function(){
        return -1;
    };

    GlobalStore.prototype.size = function(){
        return this.store.length;
    };

    GlobalStore.prototype.get = function(key, def){
        // 'undefined' === typeof def && def=null;
        return this.has(key) ? this.store.getItem(key) : def;
    };

    GlobalStore.prototype.set = function(key, value){
        this.store.setItem( key , value );
    };

    GlobalStore.prototype.del = function(key){
        this.store.removeItem(key);
    };

    GlobalStore.prototype.has = function(key){
        return this.store.getItem(key) !== null;
    };

    GlobalStore.prototype.purge = function(){
        for ( var i = this.store.length - 1; i >= 0; i-- ) {
            if ( this.store.key(i).indexOf(this.storeKey) !== -1 ) {
                this.store.removeItem(this.store.key(i));
            }
        }
    };

    GlobalStore.prototype.clear = function(){
        this.store.clear();
    };
//}
    return GStorage;
}));