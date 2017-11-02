'use strict';

var cs142App = angular.module('cs142App', ['ngRoute', 'ngMaterial', 'ngResource', ]);

cs142App.config(['$routeProvider',
function ($routeProvider) {
  $routeProvider.
  when('/users', {
    templateUrl: 'components/user-list/user-listTemplate.html',
    controller: 'UserListController'
  }).
  when('/users/:userId', {
    templateUrl: 'components/user-detail/user-detailTemplate.html',
    controller: 'UserDetailController'
  }).
  when('/photos/:userId', {
    templateUrl: 'components/user-photos/user-photosTemplate.html',
    controller: 'UserPhotosController'
  }).
  when('/advanced/photos/:userId/:photoId', {
    templateUrl: 'components/user-photos-advanced/user-photosTemplateAdvanced.html',
    controller: 'UserPhotosControllerAdvanced'
  }).
  when('/login-register', {
    templateUrl: 'components/login-register/login-registerTemplate.html',
    controller: 'login-registerController'
  }).
  when('/activityFeed', {
    templateUrl: 'components/activity/activityTemplate.html',
    controller: 'activityController'
  }).
  otherwise({
    redirectTo: '/users'
  });
}]);

cs142App.controller('MainController', ['$scope', '$rootScope', '$resource', '$location', '$http',
function ($scope, $rootScope, $resource, $location, $http) {
  $scope.main = {};
  $scope.main.title = 'Users';
  $scope.main.context = 'Users';
  $rootScope.option = false;
  $rootScope.loggedIn = false;

  var version = $resource('/test/info');
  var getVer = version.get({}, function() {
    $scope.verNum = getVer.version;
  });

  $rootScope.$on( "$routeChangeStart", function(event, next, current) {
    if ($rootScope.loggedIn === false) {
      // no logged user, redirect to /login-register unless already there
      if (next.templateUrl !== "components/login-register/login-registerTemplate.html") {
        $location.path("/login-register");
      }
    }
  });

  $scope.logout = function() {
    var res = $resource("/admin/logout");
    $rootScope.loggedIn = false;
    $scope.main.title = 'Users';
    $scope.main.context = 'Users';
    res.save({}, function(user) {
      //console.log($rootScope.loggedIn);
      console.log('logout test');
      $location.path('/login-register');
    }, function errorHandling(err) {
      console.log("Log out error");
    });

  };

  $scope.viewActivity = function() {
    console.log('Showing Activity Feed');
    $location.path('/activityFeed');
  };

  $scope.deleteUser = function() {
    alert("You Are Deleting a User Account. Are you sure?");
    var delUser = $resource("/deleteUser/"+$rootScope.cur_user_id);
    console.log('USER DELETED');
    $rootScope.loggedIn = false;
    $scope.main.title = 'Users';
    $scope.main.context = 'Users';
    delUser.save({}, function() {
      console.log('delUser Saved');
      $location.path('/login-register');
    }, function errorHandling(err) {
      console.log("Delete Log out error");
      console.log(err);
    });
  };

  var selectedPhotoFile;   // Holds the last file selected by the user
  //console.log(selectedPhotoFile);


  // Called on file selection - we simply save a reference to the file in selectedPhotoFile
  $scope.inputFileNameChanged = function (element) {
    selectedPhotoFile = element.files[0];
    console.log(selectedPhotoFile);
  };

  // Has the user selected a file?
  $scope.inputFileNameSelected = function () {
    return !!selectedPhotoFile;
  };

  // Upload the photo file selected by the user using a post request to the URL /photos/new
  $scope.uploadPhoto = function () {
    if (!$scope.inputFileNameSelected()) {
      console.error("uploadPhoto called will no selected file");
      return;
    }
    console.log('fileSubmitted', selectedPhotoFile);

    // Create a DOM form and add the file to it under the name uploadedphoto
    var domForm = new FormData();
    domForm.append('uploadedphoto', selectedPhotoFile);

    // Using $http to POST the form
    $http.post('/photos/new', domForm, {
      transformRequest: angular.identity,
      headers: {'Content-Type': undefined}
    }).then(function successCallback(response){
      // The photo was successfully uploaded.
      $rootScope.$broadcast('photo added');
    }, function errorCallback(response){
      // Couldn't upload the photo.
      console.error('ERROR uploading photo', response);
    });
  };


}]);
