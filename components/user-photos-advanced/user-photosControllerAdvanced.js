'use strict';

cs142App.controller('UserPhotosControllerAdvanced', ['$scope', '$routeParams', '$rootScope', '$resource',
function($scope, $routeParams, $rootScope, $resource) {
  /*
  * Since the route is specified as '/photos/:userId' in $routeProvider config the
  * $routeParams should have the userId property set with the path from the URL.
  */

  $scope.userId = $routeParams.userId;
  $scope.photoId = $routeParams.photoId;
  $rootScope.option = true;
  var userId = $routeParams.userId;

  var User = $resource('/user/:id',{id: userId});
  var data = User.get({}, function() {
    $scope.fullName = data.first_name + ' ' +  data.last_name;
    $scope.main.context = "Photos of" + ' ' + $scope.fullName;
  });

  var photoData = $resource('/photosOfUser/:id');
  photoData.query({id: userId}, function(photos){
    var imagesData = photos;
      $scope.fileNameList = [];
      $scope.photoIdList = [];
      for(var i = 0; i < imagesData.length; i++) {
        $scope.fileNameList.push(imagesData[i]);
        $scope.photoIdList.push(imagesData[i]._id);
      }
      //console.log($scope.fileNameList);
  });


}]);
