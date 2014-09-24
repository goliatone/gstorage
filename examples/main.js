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

    var PromisedDB = require('promiseddb');

    /**
     * Begin App
     */
    var db = new PromisedDB({
        version: 1.0,
        autoconnect: true,
        database: 'myDB',

        // This is where we build the objectStores for the DB.
        defineSchema: function() {
            this.createObjectStore('People', {
                keyPath: 'id',
                autoIncrement: true
            });
            this.createObjectStore('Groups', {
                keyPath: 'id',
                autoIncrement: true
            });
        }
    });


    var User = {
        add: function(person) {
            return db.use('People', function(execute) {
                this.objectStore('People')
                    .put(person);
            });
        },
        get: function(id) {
            return db.use('People', function(execute) {
                execute('user', this.objectStore('People')
                    .get(id));
            });
        },
        del: function(id) {
            return db.use('People', function(execute) {
                this.objectStore('People')
                    .delete(id);
            });
        }
    };


    function getUserSilliness(id) {
        var q = db.use('People', function(execute) {
            execute('user', this.objectStore('People').get(id));
        });

        q.then(function(data) {
            var user = data.user,
                silliness = user.silly ? 'very silly' : 'not very silly';
            console.log('HERE', user);
            console.log(user.name + ' is ' + silliness);
        }).catch(function(e) {
            console.warn('WE DID HIT SOMETHING HERE', e)
        });
    }

    User.add({
        name: 'Pepe',
        silly: false
    });

    var o = User.get(2);
    o.then(function(u) {
        console.warn('GET USER THEN', u)
    });

    User.add({
        name: 'Rone',
        silly: true
    });
    User.add({
        name: 'Zack',
        silly: true
    });

    // User.del(1);

    // 1 is the first ID that indexedDB registers.
    getUserSilliness(1);
    return;

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
            return new IndexedStore();
            return new LocalStore();
        }
    });

    window.gstorage = gstorage;

    gstorage.on('connected', function() {
        console.log('peperone')
        this.get('user3').on('success', function(e) {
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

        });
    });
});