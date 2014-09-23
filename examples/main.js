/*global define:true requirejs:true*/
/* jshint strict: false */
/*
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
*/
var Database = function(options) {
    if (!options || !options.version || !options.database) {
        throw new Error('Invalid arg! Specify database and version');
    }

    this.version = options.version;
    this.database = options.database;
    this.defineSchema = options.defineSchema || function() {};

    this.queue = [];

    // Use a vendor specific IndexedDB object.
    this.db = indexedDB || mozIndexedDB || webkitIndexedDB || msIndexedDB;

    if (options.autoconnect) this.connect();
};

Database.prototype.onConnected = function() {
    this.logger.info('BD connected');
};
Database.prototype.onError = function(e) {
    this.logger.error('ERROR:', e);
};
Database.prototype.logger = console;

Database.prototype.connect = function() {
    var MAX_CONNECTION_ATTEMPTS = this.maxTries || 3;
    this.tries = 0;

    var _connect = function _reconnect() {
        var req = this.db.open(this.database, this.version);
        /**
         * Since this is an event, e is an Event object
         * that holds the indexed Database object.
         */
        req.onsuccess = function(e) {
            this.connection = e.target.result;
            this.onConnected();
            this.flushQueue();
        };

        // If connection cannot be made to database.
        req.onerror = function(e) {
            if (++this.tries < MAX_CONNECTION_ATTEMPTS) {
                setTimeout(_reconnect.bind(this), 200);
            } else {
                this.onError(e);
            }
        };

        // This will run if our database is new.
        req.onupgradeneeded = function(e) {
            var connection = e.target.result;
            this.defineSchema.apply(connection);
        };

        req.onerror = req.onerror.bind(this);
        req.onsuccess = req.onsuccess.bind(this);
        req.onupgradeneeded = req.onupgradeneeded.bind(this);
    };

    _connect.call(this);
};

Database.prototype.flushQueue = function() {
    var reduce = function(last, args) {
        this.resolveTransaction.apply(this, args);
    }.bind(this);
    var out = this.queue.reduce(reduce, []);
    this.queue = [];
};

/**
 * Resolve transaction and provide results to caller
 */
Database.prototype.resolveTransaction = function(storeId, commit, resolve, reject) {
    var commands = [],
        transaction = this.connection.transaction(storeId, 'readwrite');

    /*
     * We pass the results to the resolve method.
     * Available as an argument in the `then` method!
     * `query` is actually the IDBRequest returned by
     *  `indexedbd.transaction`
     */
    var execute = function(storeId, request) {
        commands.push(new Promise(function(rs, rj) {
            console.warn('command execute', storeId, request);
            request.onerror = rj;
            request.onsuccess = function(data) {
                console.warn('success')
                rs({
                    for: storeId,
                    result: data.target.result
                });
            };
        }));
    };

    try {
        /*
         * Execute commit in transaction scope.
         */
        commit.call(transaction, execute);
    } catch (e) {
        reject(e);
    }


    Promise.all(commands)
        .then(function(values) {
            /*
             * Iterate over all promised results and collapse
             * to a single object.
             */
            var result = values.reduce(function(output, resolved) {
                output[resolved.for] = resolved.result;
                return output;
            }, {});
            resolve(result);
        });
};



/**
 * Add transaction info to queue for when database is available
 */
Database.prototype.queueTransaction = function(storeId, query, resolve, reject) {
    this.queue.push([].slice.call(arguments, 0));
};

Database.prototype.use = function(storeId, query) {
    this.storeId = storeId;
    //query here is a transaction callback.
    var executor = function(resolve, reject) {
        if (this.connection) {
            this.resolveTransaction(storeId, query, resolve, reject);
        } else {
            this.queueTransaction(storeId, query, resolve, reject);
        }
    };
    executor = executor.bind(this);

    return new Promise(executor);
};

Database.prototype.query = function(query) {
    return this.use(this.storeId, query);
};



///////////////////////////////////////////////////////
///////////////////////////////////////////////////////

/**
 * Begin App
 */

var db = new Database({
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