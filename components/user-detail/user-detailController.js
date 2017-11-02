'use strict';

cs142App.controller('UserDetailController', ['$scope', '$routeParams', '$rootScope','$resource',
function ($scope, $routeParams, $rootScope, $resource) {
  /*
  * Since the route is specified as '/users/:userId' in $routeProvider config the
  * $routeParams  should have the userId property set with the path from the URL.
  */
  var userId = $routeParams.userId;
  $scope.userId = userId;
  // console.log('UserDetail of ', userId);
  // console.log('window.cs142models.userModel($routeParams.userId)');

  var User = $resource('/user/:id',{id: userId});
  var data = User.get({}, function() {
    console.log(data);
    $scope.firstName = data.first_name;
    $scope.lastName = data.last_name;
    $scope.location = data.location;
    $scope.occupation = data.occupation;
    $scope.description = data.description;
    $scope.main.context = $scope.firstName + ' ' + $scope.lastName;
  });

  var photoData = $resource('/photosOfUser/:id');
  photoData.query({id: userId}, function(photos){
    var imagesData = photos;
      $scope.fileNameList = [];
      for(var i = 0; i < imagesData.length; i++) {
        $scope.fileNameList.push(imagesData[i]);
      }
      //console.log($scope.fileNameList);
  });

}]);
