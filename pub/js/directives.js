/**
 * Created by petersamaan on 5/19/14.
 */
/* global angular */
'use strict';

var timelogDirectives = angular.module('timelogDirectives', []);

timelogDirectives.directive('equals', function() {
    return {
        restrict: 'A', // only activate on element attribute
        require: 'ngModel', // get a hold of NgModelController
        link: function(scope, elem, attrs, ngModel) {
            if(!ngModel) return; // do nothing if no ng-model

            // watch own value and re-validate on change
            scope.$watch(attrs.ngModel, function() {
                validate();
            });

            // observe the other value and re-validate on change
            attrs.$observe('equals', function (val) {
                validate();
            });

            var validate = function() {
                // values
                var val1 = ngModel.$viewValue;
                var val2 = attrs.equals;

                // set validity
                if (val1 && val2) {
                    ngModel.$setValidity('equals', val1 === val2);
                }
            };
        }
    };
});

timelogDirectives.directive('alert', function($interval, $timeout, $rootScope){
    return {
        restrict: 'E',
        template: '<div class="alert animate-if text-center" ng-class="alertMessage[0].class" ng-show="alertMessage[0].text">' + '{{alertMessage[0].text}}' + '</div>',
        link: function (scope) {
            var remover = $interval(function(){if (typeof($rootScope.alertMessage[0])!== 'undefined') $timeout(function() {$rootScope.alertMessage.shift();},2000);},3000);
        }
    };
});