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
        $rootScope.selectedLog = {};
        $scope.currentPage = 0;
        $scope.pageSize = 3;

        $scope.startDate = new Date(Date.now()-2592000000); //today minus a month in milliseconds
        $scope.endDate = new Date(Date.now()+36000000); //today plus 10 hours in milliseconds
        $scope.workedHours = 0;
        $scope.lunchminutes = 0;
        $scope.overHours = 0;

        $scope.refreshState = function(returnedUser) {
            $scope.userLunch = returnedUser.hadlunch;
            $scope.userState = returnedUser.state;
        };

        $scope.numberOfPages=function(){
            return Math.ceil($scope.userLogArray.length/$scope.pageSize);
        };

        $scope.refreshLog = function(){
            $rootScope.AJAXLoading = true;
            $scope.userLogArray = [];
                $http.get('user-log?start='+$scope.startDate+'&end='+$scope.endDate).success(function(docs){
                if (docs.length>0) {
                    var today = new Date();
                    var todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    var todayIndex = -1;
                    for (var t = 0; t < docs.length; t++) {
                        var tempDate = new Date(docs[t].dayDate);
                        if (tempDate > todayStart) todayIndex = t;
                    }
                    if (todayIndex >=0) {
                        $scope.workedHours = docs[todayIndex].worked_minutes/60;
                        $scope.lunchminutes = docs[todayIndex].lunch_minutes;
                        $scope.overHours = docs[todayIndex].overtime_minutes/60;
                    }
                    $scope.userLogArray = docs;
                }
                $rootScope.AJAXLoading = false;
            });
        };

        $scope.selectLog = function(logEntry){
            if (logEntry.selected) {
                logEntry.selected = false;
                $rootScope.selectedLog = {};
            }
            else {
                for (var i = 0; i < $scope.userLogArray.length; i++) {
                    for (var j = 0; j < $scope.userLogArray[i].logEntries.length; j++) {
                        $scope.userLogArray[i].logEntries[j].selected = false;
                    }
                }
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
                        $http.post('/clock-in', $scope.loc).success(function(user, status){
                            if (status === 200) {
                                $scope.refreshLog();
                                $scope.refreshState(user);
                                $rootScope.AJAXLoading = false;
                                var message = {};
                                message.class = "alert-success";
                                message.text = "You've clocked in!";
                                $rootScope.alertMessage.push(message);
                                $scope.isClockedIn = true;
                            }
                            else {
                                console.log(status);
                                $rootScope.AJAXLoading = false;
                                var message = {};
                                message.class = "alert-danger";
                                message.text = "An error occured!";
                                $rootScope.alertMessage.push(message);
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
                        $http.post('/clock-out', $scope.loc).success(function(user, status){
                            if (status === 200) {
                                $scope.refreshLog();
                                $scope.refreshState(user);
                                $rootScope.AJAXLoading = false;
                                var message = {};
                                message.class = "alert-success";
                                message.text = "You've clocked out!";
                                $rootScope.alertMessage.push(message);
                                $scope.isClockedIn = false;
                            }
                            else {
                                console.log(status);
                                $rootScope.AJAXLoading = false;
                                var message = {};
                                message.class = "alert-danger";
                                message.text = "An error occured!";
                                $rootScope.alertMessage.push(message);
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
                        $http.post('/lunch-out', $scope.loc).success(function(user, status){
                            if (status === 200) {
                                $scope.refreshLog();
                                $scope.refreshState(user);
                                $rootScope.AJAXLoading = false;
                                var message = {};
                                message.class = "alert-success";
                                message.text = "You've gone out to lunch!";
                                $rootScope.alertMessage.push(message);
                                $scope.isClockedIn = true;
                            }
                            else {
                                console.log(status);
                                $rootScope.AJAXLoading = false;
                                var message = {};
                                message.class = "alert-danger";
                                message.text = result;
                                $rootScope.alertMessage.push(message);
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
                        $http.post('/lunch-in', $scope.loc).success(function(user, status){
                            if (status === 200) {
                                $scope.refreshLog();
                                $scope.refreshState(user);
                                $rootScope.AJAXLoading = false;
                                var message = {};
                                message.class = "alert-success";
                                message.text = "You've come back from lunch!";
                                $rootScope.alertMessage.push(message);
                                $scope.isClockedIn = true;
                            }
                            else {
                                console.log(status);
                                $rootScope.AJAXLoading = false;
                                var message = {};
                                message.class = "alert-danger";
                                message.text = "An error occured!";
                                $rootScope.alertMessage.push(message);
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

timelogControllers.controller('AddUserController', ['$scope', '$http', '$rootScope', '$sce', '$filter',
    function AddUserController($scope, $http, $rootScope, $sce, $filter) {
        $scope.managerTemp = {};
        $scope.manager = {};
        $http.get('user-list').success(function(result){
            $scope.users = result;
        });

    }]);

