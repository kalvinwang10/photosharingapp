'use strict';

cs142App.controller('UserListController', ['$scope', '$rootScope', '$resource',
function ($scope, $rootScope, $resource) {
  $scope.main.title = 'Users';

  var User = $resource('/user/list');
  $scope.userList = [];
  $scope.IdList = [];
  $scope.main.context = 'Users';

  User.query({}, function(fetchedList) {
    $scope.userListModel = fetchedList;
    console.log(fetchedList);
    console.log(typeof(fetchedList));
    console.log($scope.userListModel.length);
    for(var i = 0; i < $scope.userListModel.length; i++) {
      var name = $scope.userListModel[i].first_name + " " + $scope.userListModel[i].last_name;
      var id = $scope.userListModel[i]._id;
      $scope.userList.push(name);
      $scope.IdList.push(id);
    }
  });


}]);
