/*global define:true requirejs:true*/
/* jshint strict: false */
requirejs.config({
    paths: {
        'jquery': '../lib/jquery/jquery',
        'gstorage': '../src/gstorage'
    }
});

define(['gstorage', 'jquery'], function (GStorage, $) {
    console.log('Loading');
	var gstorage = new GStorage();
	gstorage.init();
});