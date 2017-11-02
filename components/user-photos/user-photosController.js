'use strict';

cs142App.controller('UserPhotosController', ['$scope', '$routeParams', '$rootScope', '$resource',
function($scope, $routeParams, $rootScope, $resource) {
  /*
  * Since the route is specified as '/photos/:userId' in $routeProvider config the
  * $routeParams should have the userId property set with the path from the URL.
  */

  var userId = $routeParams.userId;
  // $scope.FetchModel('/user/' + userId, function(fetchedData) {
  //   $scope.$apply(function() {
  //     $scope.fullName = fetchedData.first_name + ' ' + fetchedData.last_name;
  //     $scope.main.context = "Photos of" + ' ' + $scope.fullName;
  //   });
  // });

  var User = $resource('/user/:id',{id: userId});
  var data = User.get({}, function() {
    $scope.fullName = data.first_name + ' ' +  data.last_name;
    $scope.main.context = "Photos of" + ' ' + $scope.fullName;
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

  $scope.newComment = function(photoId, comment) {
    var photoRes = $resource('/commentsOfPhoto/' + photoId);
    photoRes.save({newComment: comment}, function(){
      photoData.query({id: userId}, function(photos) {
        var imagesData = photos;
          $scope.fileNameList = [];
          for(var i = 0; i < imagesData.length; i++) {
            $scope.fileNameList.push(imagesData[i]);
          }
          console.log($scope.fileNameList);
    });
  }, function errorHandling(err) {
      console.log(err);
  });
};

  $scope.liked = function(photo) {
    $scope.numLikes = photo.likes.filter(function(value) { return value !== null; }).length;
    console.log('FILTERED', photo.likes.filter(function(value) { return value !== null; }));
    if(photo.likes.indexOf($rootScope.cur_user_id) === -1) {
      //console.log('cur UserID: ', $rootScope.cur_user_id);
      $scope.likebutton = 'Like';
      return true;
    } else {
      $scope.likebutton = 'Unlike';
      return false;
    }
  };

  $scope.likePhoto = function(photoId) {
    var photoLike = $resource('/addLike/' + photoId);
    console.log('Photo Liked!');
    photoLike.save({}, function(){
      photoData.query({id: userId}, function(photos) {
        var imagesData = photos;
        $scope.fileNameList = [];
        for(var i = 0; i < imagesData.length; i++) {
          $scope.fileNameList.push(imagesData[i]);
        }
        //console.log($scope.fileNameList);
      });
    }, function errorHandling(err) {
      console.log(err);
    });
  };

  $scope.unlikePhoto = function(photoId) {
    console.log('Photo unliked!');
    var photoUnlike = $resource('/removeLike/'+ photoId);
    photoUnlike.save({}, function() {
      photoData.query({id: userId}, function(photos) {
        var imagesData = photos;
        $scope.fileNameList = [];
        for(var i = 0; i < imagesData.length; i++) {
          $scope.fileNameList.push(imagesData[i]);
        }
        //console.log($scope.fileNameList);
      });
    }, function errorHandling(err) {
      console.log(err);
    });
  };

  $scope.deleteComment = function(photoId, comment) {
    console.log('Comment Deleted', comment);
    var commentDel = $resource('/deleteComment/'+photoId+'/'+comment._id);
    commentDel.save({}, function() {
      photoData.query({id: userId}, function(photos) {
        var imagesData = photos;
        $scope.fileNameList = [];
        for(var i = 0; i < imagesData.length; i++) {
          $scope.fileNameList.push(imagesData[i]);
        }
        //console.log($scope.fileNameList);
      });
    }, function errorHandling(err) {
      console.log(err);
    });
  };

  $scope.deletePhoto = function(photoId) {
    var photoDel = $resource('/deletePhoto/' + photoId);
    photoDel.save({}, function() {
      photoData.query({id: userId}, function(photos) {
        var imagesData = photos;
        $scope.fileNameList = [];
        for(var i = 0; i < imagesData.length; i++) {
          $scope.fileNameList.push(imagesData[i]);
        }
        //console.log($scope.fileNameList);
      });
    }, function errorHandling(err) {
      console.log(err);
    });
  };

  $scope.hasDelOption = function(commentId) {
    console.log('Object ID: ', String(commentId));
    if (String(commentId) === $rootScope.cur_user_id) {

      return true;
    }
    return false;
  };


}]);
