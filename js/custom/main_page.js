//this variale is used to store a reference
//to perform the export of the report whose output
//is currently visible in the center panel of the application
var report;

$(document).ready(function(){
    $('#login').click(function(){
		//detect if which action should be performed
		if($("#login").text() == ' Login'){
			$('#id01').css("display",'block');
		}
		else{
			visualize(
				function (v) {
					v.logout().done(function(){
						console.log('user '+ $("#j_username").val() +'logged out');
						$("#login").html(function (){
							return $(this).html().replace("<span class=\"glyphicon glyphicon-log-out\"></span> Logout", "<span class=\"glyphicon glyphicon-log-in\"></span> Login"); 
						});
						
						clearListAndReportOutput();
						
					});
				},
				function(error){
					alert(error);
				}
			);
		}
    });
	
	//https://stackoverflow.com/questions/13437446/how-to-display-selected-item-in-bootstrap-button-dropdown-title
	/*
	$('.dropdown').each(function (key, dropdown) {
        var $dropdown = $(dropdown);
        $dropdown.find('.dropdown-menu a').on('click', function () {
            $dropdown.find('button').text($(this).text()).append(' <span class="caret"></span>');
			alert($(this).text());
        });
    });
	*/
	$('.dropdown').each(function (key, dropdown) {
        var $dropdown = $(dropdown);
        $dropdown.find('.dropdown-menu a').on('click', function () {
 			doExport($(this).text());
        });
    });
	
});

function doExport(format){
	visualize(
		function (v) {
		report.export({
				outputFormat: format
			})
			.done(function (link) {
				window.open(link.href); // open new window to download report
			})
			.fail(function (err) {
				alert(err.message);
			});
			
	});
	
}

$( "#target" ).submit(function( event ) {
	visualize(
			{
				server : "http://localhost:8630/jasperserver-pro", 
				auth: { 
					name: $("#j_username").val(), 
					password: $("#j_password").val()
			}
			},
		function (v) {
				console.log($("#j_username").val());
				console.log($("#j_password").val());
				$('#id01').css("display",'none');
				$("#login").html(function (){
					return $(this).html().replace("<span class=\"glyphicon glyphicon-log-in\"></span> Login", "<span class=\"glyphicon glyphicon-log-out\"></span> Logout"); 
				});
				printListAndRunFirstItem();
				
		},
		function(error){
			alert(error);
		}
	);

	event.preventDefault();
});

//if user is logged in, render a list of reports in the window on the left
//and run the firts report from list in the window in the middle of the screen

function isLoggedIn(){
	var status = $("#login").text().replace(/\s/g, '');
	if( status == 'Login'){
		return false;
	}
	else{
		return true;
	}
}

/*
if someone is loggedin, render a list of reports on left tab,
and execute the first report on the tab in the middle of the screen
*/
function printListAndRunFirstItem(){
if(isLoggedIn() == true){
	visualize(
		function (v) {
			var content="";
			
			var query = v.resourcesSearch({
			server:"http://localhost:8630/jasperserver-pro",
			folderUri: "/public/SME",
			recursive: false,
			runImmediately : false
			});

			query.run().done(function(results){
				buildReportItems(results);
			});

		},
		function(error){
			alert(error);
		}
)};

	function buildReportItems(results){
		var reportsList = '';
		
		function buildReportItem(control){
			var template = "<p><a href='#' class='resourceItem' data-ri='{data}' >{reportName}</a></p>";
			reportsList+=template.replace("{data}", JSON.stringify(control)).replace("{reportName}", control.label);
		}
		
		results.forEach(buildReportItem);
		$("#reportsList").append($(reportsList));
		
		$( ".resourceItem" ).each(function() {
			$(this).on( "click", runReport);
		});
		
		//$("#reportsList").css( "border", "3px solid red" );
		renderFirstItem();
	}

	function renderFirstItem(){
	var jsonInfoAboutObject = $("#reportsList").first().children().eq(0).first().children().data("ri");
	console.log(jsonInfoAboutObject.uri);
	
		visualize(
			function (v) {
				//var report = v.report({
				report = v.report({
				resource: jsonInfoAboutObject.uri,
				container: "#report"
			});
			
		});
	}
}

function runReport(){
	var jsonInfoAboutObject = $(this).data("ri");
	visualize(
		function (v) {
			//var report = v.report({
			report = v.report({
				resource: jsonInfoAboutObject.uri,
				container: "#report"
			});
		});	
}

function clearListAndReportOutput(){
	$("#reportsList").empty();
	$("#report").empty();
	
}

$('#applyValue').click(function(){
	console.log("applyValue on click test method");
	
});