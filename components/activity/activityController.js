'use strict';

cs142App.controller('activityController', ['$scope', '$routeParams', '$rootScope', '$resource',
function($scope, $routeParams, $rootScope, $resource) {

  var activity = $resource('/activityFeed');
  activity.query({}, function(activityObj) {
    $scope.activityFeed = activityObj;
    console.log("Activity Feed:   ", activityObj);
  });

  $scope.hasPhoto = function(activity) {
    if(activity.photo === undefined) {
      return false;
    }
    return true;
  };

}]);
