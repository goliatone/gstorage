/*global define:true requirejs:true*/
/* jshint strict: false */
requirejs.config({
    paths: {
        'jquery': 'jquery/jquery',
        'extend': 'gextend/extend',
        'gpub': 'gpub/gpub',
        'gstorage': 'gstorage',
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
            /*return new WSQLStore({
                storeID: this.storeID,
                storeName: this.storeName,
                hashLength: this.hashLength
            });*/
            return new IndexedStore();
            return new LocalStore();
        }
    });

    window.gstorage = gstorage;

    gstorage.on('connected', function() {
        console.log('peperone');


        this.get('user3').then(function(e) {
            if (e) {
                console.log('==> Transaction complete', e);
            } else {
                this.set('user3', {
                    active: false,
                    age: 23,
                    email: 'asko@som.es',
                    name: 'askone'
                });
            }
        }.bind(this)).then(function(){
            console.log('NEXT')
            this.set('peperone', {
                name:'peperone',
                age:33
            }).then(function(e){
                console.warn('SET', e)
            })
        }.bind(this));
    });
});