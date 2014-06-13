/**
 * Created by petersamaan on 5/19/14.
 */
/* global angular */
'use strict';

var timelogControllers = angular.module('timelogControllers', []);

timelogControllers.filter('startFrom', function() {
    return function(input, start) {
        start = +start; //parse to int
        return input.slice(start);
    };
});

timelogControllers.controller('PersonalPageController', ['$scope', '$http', '$rootScope', '$sce', '$filter',
    function PersonalPageController($scope, $http, $rootScope, $sce, $filter) {

        $scope.loc ={};
        $scope.forms = {};
        $scope.changePass = false;

        // TODO refactor log handler code to a service, and log display html to a template to include.

        $scope.userLogArray = [];
        $scope.userLog = {};
        $rootScope.selectedLog = {};
        $scope.currentPage = 0;
        $scope.pageSize = 3;

        $scope.logArraySort = function(logEntries) {
            return logEntries[0].datetime;
        };

        $scope.numberOfPages=function(){
            return Math.ceil($scope.userLogArray.length/$scope.pageSize);
        };

        $scope.refreshLog = function(){ //TODO simplify this, no real need for duplicate log data structure
            $http.get('user-log').success(function(docs){
                var days = Object.keys($scope.userLog);
                for (var j = 0; j <= days.length; j++) {
                    for (var i = 0; i< docs.length; i++) {
                        var found = false;
                        var logDay = $filter('date')(docs[i].datetime, "shortDate");
                        if (!$scope.userLog[logDay]) $scope.userLog[logDay] = [];
                        else for (var k = 0; k < $scope.userLog[logDay].length; k++) if ($scope.userLog[logDay][k]._id === docs[i]._id) found = true;
                        if (!found) $scope.userLog[logDay].push(docs[i]);
                    }
                }
                for (var daysLog in $scope.userLog) {
                    var foundArray = false;
                    for (var l = 0 ; l < $scope.userLogArray.length; l++) if ($scope.userLogArray[l][0].datetime === $scope.userLog[daysLog][0].datetime) foundArray = true;
                    if (!foundArray) $scope.userLogArray.push($scope.userLog[daysLog]);
                }
            });
        };

        $scope.selectLog = function(logEntry){
            if (logEntry.selected) {
                logEntry.selected = false;
                $rootScope.selectedLog = {};
            }
            else {
                for (var log in $scope.userLog) for (var j = 0; j < $scope.userLog[log].length; j++) $scope.userLog[log][j].selected = false;
                logEntry.selected = true;
                $rootScope.selectedLog.locUrl = $sce.trustAsResourceUrl("https://www.google.com/maps/embed/v1/place?q=" + logEntry.loc.lat + "%2C" + logEntry.loc.lon + "&key=AIzaSyD7Xn1-U_EPH8o0FUyWzGSyTaHWhYyT1hE");
            }
        };

        $scope.refreshLog();


        //Change password function
        $scope.sendPass = function() {
            $scope.forms.changePassword.email= $scope.userEmail;
            $http.post('/change-password', $scope.forms.changePassword).success(function(result){
                console.log(result);
                $scope.changePass = false;
                if (result === 'OK') {
                    var message = {};
                    message.class = "alert-success";
                    message.text = "Password Changed";
                    $rootScope.alertMessage.push(message);
                }
            });
        };

        //Clock actions here
        $scope.clockIn = function() {
            $rootScope.AJAXLoading = true;
            if(geo_position_js.init()){
                geo_position_js.getCurrentPosition(function(p){
                        $scope.loc.lat = p.coords.latitude.toFixed(2);
                        $scope.loc.lon = p.coords.longitude.toFixed(2);
                        $scope.locUrl = $sce.trustAsResourceUrl("https://www.google.com/maps/embed/v1/place?q=" + $scope.loc.lat + "%2C" + $scope.loc.lon + "&key=AIzaSyD7Xn1-U_EPH8o0FUyWzGSyTaHWhYyT1hE");
                        $http.post('/clock-in', $scope.loc).success(function(result){
                            if (result === 'OK') {
                                $scope.refreshLog();
                                $rootScope.AJAXLoading = false;
                                var message = {};
                                message.class = "alert-success";
                                message.text = "You've clocked in!";
                                $rootScope.alertMessage.push(message);
                                $scope.isClockedIn = true;
                                $scope.userState = "working";
                                $scope.userLunch = false;
                            }
                        });
                    },
                    function(p){
                        console.log('error='+p.code);
                    },
                    {enableHighAccuracy:true});
            }
            else{
                console.log("GPS functionality not available/allowed");
            }
        };
        $scope.clockOut = function() {
            $rootScope.AJAXLoading = true;
            if(geo_position_js.init()){
                geo_position_js.getCurrentPosition(function(p){
                        $scope.loc.lat = p.coords.latitude.toFixed(2);
                        $scope.loc.lon = p.coords.longitude.toFixed(2);
                        $scope.locUrl = $sce.trustAsResourceUrl("https://www.google.com/maps/embed/v1/place?q=" + $scope.loc.lat + "%2C" + $scope.loc.lon + "&key=AIzaSyD7Xn1-U_EPH8o0FUyWzGSyTaHWhYyT1hE");
                        $http.post('/clock-out', $scope.loc).success(function(result){
                            if (result === 'OK') {
                                $scope.refreshLog();
                                $rootScope.AJAXLoading = false;
                                var message = {};
                                message.class = "alert-success";
                                message.text = "You've clocked out!";
                                $rootScope.alertMessage.push(message);
                                $scope.isClockedIn = false;
                                $scope.userState = "off";
                            }
                        });
                    },
                    function(p){
                        console.log('error='+p.code);
                    },
                    {enableHighAccuracy:true});
            }
            else{
                console.log("GPS functionality not available/allowed");
            }
        };
        $scope.toLunch = function() {
            $rootScope.AJAXLoading = true;
            if(geo_position_js.init()){
                geo_position_js.getCurrentPosition(function(p){
                        $scope.loc.lat = p.coords.latitude.toFixed(2);
                        $scope.loc.lon = p.coords.longitude.toFixed(2);
                        $scope.locUrl = $sce.trustAsResourceUrl("https://www.google.com/maps/embed/v1/place?q=" + $scope.loc.lat + "%2C" + $scope.loc.lon + "&key=AIzaSyD7Xn1-U_EPH8o0FUyWzGSyTaHWhYyT1hE");
                        $http.post('/lunch-out', $scope.loc).success(function(result){
                            if (result === 'OK') {
                                $scope.refreshLog();
                                $rootScope.AJAXLoading = false;
                                var message = {};
                                message.class = "alert-success";
                                message.text = "You've gone out to lunch!";
                                $rootScope.alertMessage.push(message);
                                $scope.isClockedIn = true;
                                $scope.userState = "lunch";
                            }
                        });
                    },
                    function(p){
                        console.log('error='+p.code);
                    },
                    {enableHighAccuracy:true});
            }
            else{
                console.log("GPS functionality not available/allowed");
            }
        };
        $scope.fromLunch = function() {
            $rootScope.AJAXLoading = true;
            if(geo_position_js.init()){
                geo_position_js.getCurrentPosition(function(p){
                        $scope.loc.lat = p.coords.latitude.toFixed(2);
                        $scope.loc.lon = p.coords.longitude.toFixed(2);
                        $scope.locUrl = $sce.trustAsResourceUrl("https://www.google.com/maps/embed/v1/place?q=" + $scope.loc.lat + "%2C" + $scope.loc.lon + "&key=AIzaSyD7Xn1-U_EPH8o0FUyWzGSyTaHWhYyT1hE");
                        $http.post('/lunch-in', $scope.loc).success(function(result){
                            if (result === 'OK') {
                                $scope.refreshLog();
                                $rootScope.AJAXLoading = false;
                                var message = {};
                                message.class = "alert-success";
                                message.text = "You've come back from lunch!";
                                $rootScope.alertMessage.push(message);
                                $scope.isClockedIn = true;
                                $scope.userState = "working";
                                $scope.userLunch = true;
                            }
                        });
                    },
                    function(p){
                        console.log('error='+p.code);
                    },
                    {enableHighAccuracy:true});
            }
            else{
                console.log("GPS functionality not available/allowed");
            }
        };
    }]);

