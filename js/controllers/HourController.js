app.factory('quote', ['$http', function($http) {
	var url = "http://query.yahooapis.com/v1/public/yql";
	var symbol = "tsla";
	var qstring = "select * from yahoo.finance.quotes where symbol in ('" + symbol + "')";

	return $http.get(url + '?q=' + qstring + "&format=json&diagnostics=true&env=http://datatables.org/alltables.env") 
		.success(function(data) {
			return data;
		}) 
		.error(function(err) {
			return err;
		});
}]);

app.controller('MainController', ['$scope', '$http', 'quote', function($scope, $http, quote) {
	$scope.tsla = {
		total: 0,
		change: 0,
		color: {"color":"green"}
	}
	quote.success(function(data) {
		//console.log(data);
		$scope.tsla.total = data.query.results.quote.LastTradePriceOnly;
		$scope.tsla.change = data.query.results.quote.Change;
		if ($scope.tsla.change >= 0) {
				$scope.tsla.color = {"color":"green"};
			} else {
				$scope.tsla.color = {"color":"red"};
			};
			//console.log($scope.tsla);
	});

	$scope.payrate = 28;
	$scope.date = new Date();
	//console.log($scope.date);

	/*
	Required Format: 2014-03-08T00:00:00
	Server Format:   1970-01-01T20:00:00.000Z
	*/
	$scope.loadHours = function() {
		$http.get("php/getdata.php")
		.success(function (data) {
			//console.log($scope.hours);
			for (var i = data.length - 1; i >= 0; i--) {
				//data[i].win = data[i].win.substring(0, data[i].win.length - 4);
				data[i].win.slice(0,-5);
				data[i].lout.slice(0,-5);
				data[i].lin.slice(0,-5);
				data[i].wout.slice(0,-5);
				data[i].win = new Date(data[i].win);
				data[i].lout = new Date(data[i].lout);
				data[i].lin = new Date(data[i].lin);
				data[i].wout = new Date(data[i].wout);
				console.log(data[i]);
			};
			$scope.hours = data;
			//console.log($scope.hours);
		}).error(function () {
			alert("An unexpected error ocurred!");
		});
	};
	$scope.loadHours();

	$scope.httpPost = function() {
		//console.log("prepost");
		$http.post('php/setdata.php', JSON.stringify($scope.hours))
		.error(function(status){console.log(status)});
		//console.log("postpost");
		alert("Hours Saved");
	};

	$scope.clearHours = function() {
		//reset all of the values
		var clear = new Date("1970-01-01T08:00:00");
		for (var i = $scope.hours.length - 1; i >= 0; i--) {
			$scope.hours[i].wout = clear;
			$scope.hours[i].win = clear;
			$scope.hours[i].lin = clear;
			$scope.hours[i].lout = clear;
		}
		//post to the server
		$http.post('php/setdata.php', JSON.stringify($scope.hours))
		.error(function(status){console.log(status)});
		alert("Hours Cleared and Saved");
	};

	$scope.total = function() {
		var total = 0;
		for (var i = $scope.hours.length - 1; i >= 0; i--) {
			total += ($scope.hours[i].wout - $scope.hours[i].win) - ($scope.hours[i].lin - $scope.hours[i].lout);
		}
		// compensate for minutes      (/ 60)
		// compensate for seconds 	   (/ 60)
		// compensate for milliseconds (/ 1,000)
		// total                       (/ 3,600,000)
		total = total / 3600000;
		return total;
	};

	$scope.overtime = function() {
		var overtime = 0;
		var temp = 0;
		var days = 0;
		var workdays = 0;
		for (var i = $scope.hours.length - 1; i >= 0; i--) {
			temp = ($scope.hours[i].wout - $scope.hours[i].win) - ($scope.hours[i].lin - $scope.hours[i].lout);
			// compensate for minutes      (/ 60)
			// compensate for seconds 	   (/ 60)
			// compensate for milliseconds (/ 1,000)
			// total                       (/ 3,600,000)
			temp = temp / 3600000;

			days = days + 1;
			if (temp > 0) {
				workdays += 1;
			}
			if (workdays > 5) {
				overtime += temp;
			}
			if (temp > 8) {
				overtime += (temp - 8);
			}
			if (days == 7) {
				workdays = 0;
			}
		}
		return overtime;
	};

	$scope.grosspay = function() {
		//total returns (regular + overtime)
		//overtime returns (overtime) but since it is double counted
		// Overtime should be 1.5x pay, so I added Overtime x 0.5
		return (($scope.total() * 1) + ($scope.overtime() * 0.5)) * $scope.payrate;
	};

	$scope.paycheck = function() {
		//I put 4% towards my 401k as is the default for Tesla
		//as calculated online, paycheck is ~74% of gross pay after 401k
		return ($scope.grosspay() * 0.74);
	};
}]);