/*global define:true requirejs:true*/
/* jshint strict: false */

requirejs.config({
    paths: {
        'jquery': 'jquery/jquery',
        'extend': 'gextend/extend',
        'gpub': 'gpub/gpub',
        'gstorage': 'gstorage',
        'promiseddb':'promiseddb',
        'localstore': 'local.store',
        'websqlstore': 'websql.store',
        'indexedstore': 'indexed.store'
    }
});

define('main', function(require) {
    console.log('Loading');

    var GStorage = require('gstorage'),
        GPup = require('gpub'),
        LocalStore = require('localstore'),
        WSQLStore = require('websqlstore'),
        IndexedStore = require('indexedstore'),
        $ = require('jquery');

    GPup.observable(GStorage);
    GPup.observable(LocalStore);
    GPup.observable(WSQLStore);
    GPup.observable(IndexedStore);

    var gstorage = new GStorage({
        buildDefaultStore: function() {
            //Use NullStore
            // return new WSQLStore({
            //     storeId: this.storeId,
            //     storeName: this.storeName,
            //     hashLength: this.hashLength
            // });
            // return new IndexedStore();
            return new LocalStore();
        }
    });

    window.gstorage = gstorage;

    gstorage.get('user3').then(function(e) {
        if (e) {
            console.log('==> Transaction complete', e);
        }
    });

    gstorage.set('user3', {
        active: false,
        age: 23,
        email: 'asko@som.es',
        name: 'askone'
    });

    gstorage.on('change', function(e){
        console.debug('chachachachaaaange', e);
    })
});