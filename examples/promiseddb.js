/*global define:true requirejs:true*/
/* jshint strict: false */

requirejs.config({
    paths: {
        'jquery': 'jquery/jquery',
        'extend': 'gextend/extend',
        'promiseddb':'promiseddb'

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
            return db.with('People', function(execute) {
                this.objectStore('People')
                    .put(person);
            });
        },
        get: function(id) {
            return db.with('People', function(execute) {
                execute(this.objectStore('People')
                    .get(id));
            });
        },
        del: function(id) {
            return db.with('People', function(execute) {
                this.objectStore('People')
                    .delete(id);
            });
        },
        getUserStatus: function(id) {
            var q = db.with('People', function(execute) {
                execute(this.objectStore('People').get(id), 'user');
            });

            q.then(function(data) {
                var user = data.user,
                    active = user.active ? 'very active' : 'not very active';
                console.debug(user.name + ' is ' + active);
            }).catch(function(e) {
                console.error('ERROR:', e);
            });
        }
    };

    User.add({
        name: 'Pepe',
        active: false
    });

    var o = User.get(2);
    o.then(function(u) {
        console.warn('=> GET USER RESULT:', u);
        return u.result;
    }).then(function(e){
        console.warn('=> GET USER TRANSFORMED:', e);
    });

    User.add({
        name: 'Rone',
        active: true
    });
    User.add({
        name: 'Goliat',
        active: true
    });

    // User.del(1);

    User.getUserStatus(1);
});