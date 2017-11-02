'use strict';

cs142App.controller('login-registerController', ['$scope', '$routeParams', '$rootScope', '$resource', '$location',
function($scope, $routeParams, $rootScope, $resource, $location) {
  /*
  * Since the route is specified as '/photos/:userId' in $routeProvider config the
  * $routeParams should have the userId property set with the path from the URL.
  */
  $scope.ifLoginFail = false;

  $scope.login = function() {
    var userRes = $resource("/admin/login");
    userRes.save({login_name: $scope.login_name, password: $scope.password}, function (user) {
      $rootScope.loggedIn = true;
      $rootScope.first_name = user.first_name;
      $rootScope.cur_user_id = user._id;
      $location.path("/users/"+user._id);
      console.log('logged in as:',$rootScope.first_name);
      $rootScope.$broadcast('Logged In');
    }, function errorHandling(err) {
      $scope.ifLoginFail = true;
      console.log('login-failed');
    });
  };

  $scope.register = function() {


    var reg = $resource('/user');
    reg.save({first_name: $scope.reg_first_name, last_name: $scope.reg_last_name, location: $scope.reg_location,
         description: $scope.reg_description, occupation: $scope.reg_occupation, login_name: $scope.reg_login_name,
         password: $scope.password }, function(user) {
           console.log('Registration Complete');
           $location.path("/login-register");
         }, function errorHandling(err) {
           console.log('registration-failed');
         });
  };


}]);
