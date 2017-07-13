//this variale is used to store a reference
//to perform the export of the report whose output
//is currently visible in the center panel of the application
var report;
var params_data;
var applicationFolder = "/public/SME";
var host="http://localhost:8630/jasperserver-pro";
//var host="http://10.98.50.212:8630/jasperserver-pro";

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
	
	//connect event hanglers to the navigation buttons
	$("#btnFirst").on("click", navigateFirstPage);
	$("#btnPrevious").on("click", navigatePreviousPage);
	$("#btnNext").on("click", navigateNextPage);
	$("#btnLast").on("click", navigateLastPage);
});

function navigateFirstPage(){
	visualize(
		function (v) {
		var currentPage = report.pages() || 1;
		report
		.pages(1)
		.run()
		.fail(function(err) { alert(err); });

		$("#currentPage").val("1");
	});
}

function navigateNextPage(){
	visualize(
		function (v) {
		var currentPage = report.pages() || 1;
		
		if(currentPage < $("#totalPages").val()){
			report
			.pages(++currentPage)
			.run()
			.fail(function(err){ 
					console.log(err);
				});
			$("#currentPage").val(currentPage);
		}
	});
}

function navigatePreviousPage(){
	visualize(
		function (v) {
		var currentPage = report.pages() || 1;
		
		if( currentPage > 1){
			report
			.pages(--currentPage)
			.run()
			.fail(function(err) { 
					console.log(err);
				});
			$("#currentPage").val(currentPage);
		}
	});
}

function navigateLastPage(){
	visualize(
		function (v) {
		var currentPage = report.pages() || 1;
		report
		.pages($("#totalPages").val())
		.run()
		.fail(function(err) { alert(err); });
		$("#currentPage").val($("#totalPages").val());
	});
}

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
				server : host,
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
				$("#functCont").css("display",'block');
				$("#icCont").css("display",'block');
				$("#report").css("display",'block');
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
			server: host,
			folderUri: applicationFolder,
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
	$("#forIC").data('ri', jsonInfoAboutObject);
	console.log(jsonInfoAboutObject.uri);
	
		visualize(
			function (v) {
				var reportLocal = v.report({
				resource: jsonInfoAboutObject.uri,
				container: "#report",
				events: {
					reportCompleted: function(status){
						console.log("Report status "+status);
					},
					changeTotalPages: function(totalPages) {
						console.log("Total Pages:" + totalPages);
						setFirstAndLastPageNumbers(totalPages);
					}
				},
				error: function(error) {
						console.log("Report error "+error);
				}
			});
			report = reportLocal;
			removeInputControlsAndEvents();
			buildInputControls(jsonInfoAboutObject.uri);	
		});
	}
}

function runReport(){
	var jsonInfoAboutObject = $(this).data("ri");
	$("#forIC").data('ri', jsonInfoAboutObject);
	visualize(
		function (v) {
			console.log(JSON.stringify(report));
			var reportLocal = v.report({
				resource: jsonInfoAboutObject.uri,
				container: "#report",
				events: {
					reportCompleted: function(status){
						console.log("Report status "+status);
					},
					changeTotalPages: function(totalPages) {
						console.log("Total Pages:" + totalPages);
						setFirstAndLastPageNumbers(totalPages);
					}
				},
				error: function(error) {
						console.log("Report error "+error);
				}
			});
			report = reportLocal;
			//scan for input controls, if they present, build them
			/*
			console.log ("areInputControlsPresent(jsonInfoAboutObject.uri)");
			
			function callback(data){
				console.log(data.length > 0 ? true : false);
			}
			console.log(areInputControlsPresent(jsonInfoAboutObject.uri, callback));
			*/
			removeInputControlsAndEvents();
			buildInputControls(jsonInfoAboutObject.uri);			
		});	
}

function areInputControlsPresent(reportUri, callback){
	var result;
	visualize(function(v){
		var ic = v.inputControls({
			resource: reportUri,
			success: function(data) {
				callback(data);
			}
		});
	});

}

function removeInputControlsAndEvents(){
	$("#ic").empty();	
}

function buildInputControls(reportUri){
	visualize(function(v){
		var ic = v.inputControls({
			resource: reportUri,
			success: function(data) {
			//if the report has input controls, continue processing
			if(data.length > 0){
				var icDefinition = "";
				console.log("DATA " + data.length);
				
				for(var i = 0; i < data.length; i++){
					switch(data[i].type) {
						case 'singleSelect':
							var icTemplate="<div id='cont_{id}' ><p>{description}</p>{ic}</div>";
							var icTag="<select name='ic_{inputControlId}' data-slave='{data}' data-master='{master}' data-type={type}>{options}</select>";
							var optionTag="<option value='{value}' {selected}>{label}</option>";
							var options="";
							var ic="";
							for(var n = 0; n < data[i].state.options.length; n++){
								options +=optionTag.replace("{value}", data[i].state.options[n].value)
										 .replace("{label}", data[i].state.options[n].label)
										 .replace("{selected}", data[i].state.options[n].selected ? "selected":"");
							}
							
							options = icTag.replace("{inputControlId}", data[i].id).
											replace("{data}", JSON.stringify(data[i].slaveDependencies)).
											replace("{master}", JSON.stringify(data[i].masterDependencies)).
											replace("{type}", JSON.stringify(data[i].type)).
											replace("{options}", options);

							ic = icTemplate.replace("{id}", data[i].id).
											replace("{description}", data[i].description).
											replace("{ic}",options);
											
							console.log(JSON.stringify(data[i].slaveDependencies));
							
							$("#ic").append(ic);							
						break;
						case 'multiSelect':
							var icTemplate="<div id='cont_{id}'><p>{description}</p>{ic}</div>";
							var icTag="<select name='ic_{inputControlId}' data-slave='{data}' data-master='{master}' data-type={type} multiple>{options}</select>";
							var optionTag="<option value='{value}' {selected}>{label}</option>";
							var options="";
							var ic="";
							
							for(var n = 0; n < data[i].state.options.length; n++){
								options +=optionTag.replace("{value}", data[i].state.options[n].value)
										 .replace("{label}", data[i].state.options[n].label)
										 .replace("{selected}", data[i].state.options[n].selected ? "selected":"");
							}
							
							options = icTag.replace("{inputControlId}", data[i].id).
											replace("{data}", JSON.stringify(data[i].slaveDependencies)).
											replace("{master}", JSON.stringify(data[i].masterDependencies)).
											replace("{type}", JSON.stringify(data[i].type)).
											replace("{options}", options);

							ic = icTemplate.replace("{id}", data[i].id).
											replace("{description}", data[i].description).
											replace("{ic}",options);
							
							$("#ic").append(ic);							
						break;
						case 'singleSelectRadio':
							var icTemplate="<div id='cont_{id}'><p>{description}</p>{ic}</div>";
							var icTag="<form action='' id='ic_{inputControlId}'>{options}</form>";
							var optionTag="<input type='radio' name='{id}' data-slave='{data}' data-master='{master}' data-type={type} value='{value}' {checked}> {label}<br>";
							var options="";
							var ic="";
							for(var n = 0; n < data[i].state.options.length; n++){
								options +=optionTag.replace("{value}", data[i].state.options[n].value)
										 .replace("{label}", data[i].state.options[n].label)
										 .replace("{id}", data[i].id)
										 .replace("{data}", JSON.stringify(data[i].slaveDependencies))
										 .replace("{master}", JSON.stringify(data[i].masterDependencies))
										 .replace("{type}", JSON.stringify(data[i].type))
										 .replace("{checked}", data[i].state.options[n].selected ? "checked":"");
							}
							
							options = icTag.replace("{inputControlId}", data[i].id).
											replace("{options}", options);

							ic = icTemplate.replace("{id}", data[i].id).
											replace("{description}", data[i].description).
											replace("{ic}",options);
							
							$("#ic").append(ic);							
						break;
					} 
				}

				//bind onChange events to appropriate input controls
				for(var m = 0; m < data.length; m++){
					var resourceName = "";
					//detect a type of event that should be connected to the IC
					switch(data[m].type) {
						case 'singleSelect':
							resourceName = "select[name*='ic_"+data[m].id+"']";
						break;
						case 'multiSelect':
							resourceName = "select[name*='ic_"+data[m].id+"']";
						break;
						case 'singleSelectRadio':
							resourceName = "input[name*='"+data[m].id+"']";
						break;
					}

					$(document).on('change', resourceName, function(){
							var icName = $(this).attr('name');
						
							params_data = {};
							
							//current ic
							if($(this).data('type') == 'multiSelect'){							
								params_data[$(this).attr('name').substring(3)] = $(this).val();
							}
							else if ($(this).data('type') == 'singleSelect'){
								params_data[$(this).attr('name').substring(3)] = [$(this).val()];
							}
							else if ($(this).data('type') == 'singleSelectRadio'){
								params_data[$(this).attr('name')] = [$(this).val()];
							}
							
							//master ic
							for(var d = 0; d < $(this).data('master').length; d++){
								console.log("master");
								console.log($(this).data('master')[d]);
								if($("select[name*='ic_" + $(this).data('master')[d] + "']").data('type') == 'multiSelect'){							
									params_data[$(this).data('master')[d]] = $("select[name*='ic_" + $(this).data('master')[d] + "']").val();
								}
								else if ($("select[name*='ic_" + $(this).data('master')[d] + "']").data('type') == 'singleSelect'){
									params_data[$(this).data('master')[d]] = [$("select[name*='ic_" + $(this).data('master')[d] + "']").val()];
								}
								else if ($("input[name*='" + $(this).data('master')[d] + "']").data('type') == 'singleSelectRadio'){
									params_data[$(this).data('master')[d]] = [$("input[name*='" + $(this).data('master')[d] + "']").val()];
								}
	
							}
							
							//slave
							for(var e = 0; e < $(this).data('slave').length; e++){
								console.log("slave");
								console.log($(this).data('slave')[e]);
								if($("select[name*='ic_" + $(this).data('slave')[e] + "']").data('type') == 'multiSelect'){							
									params_data[$(this).data('slave')[e]] = $("select[name*='ic_" + $(this).data('slave')[e] + "']").val();
								}
								else if ($("select[name*='ic_" + $(this).data('slave')[e] + "']").data('type') == 'singleSelect'){
									params_data[$(this).data('slave')[e]] = [$("select[name*='ic_" + $(this).data('slave')[e] + "']").val()];
								}
								else if ($("input[name*='" + $(this).data('master')[d] + "']").data('type') == 'singleSelectRadio'){
									params_data[$(this).data('master')[d]] = [$("input[name*='" + $(this).data('master')[d] + "']").val()];
								}
							}
							
							var inputControls = v.inputControls({
												resource: reportUri
											});
							
							console.log("---------- params_data ----------");
							console.log(params_data);
							
							inputControls
								.params(params_data)
								.run()
								.then(renderInputControls);

							
							function renderInputControls(data) {
								console.log("---------- ic data ----------");
								//this block contains a logic that should just
								//update existing input controls with sets of information
								//that has just been retrieved from JasperReports Server
								
								for(var n = 0; n <  $("select[name*='ic_").length; n++ ){
									//if(icName != $("select[name*='ic_")[n].name){
											$('[name="'+ $("select[name*='ic_")[n].name +'"]').empty();
											var currentSet = _.findWhere(data, {id: $("select[name*='ic_")[n].name.substring(3)});
											var optionTag="<option value='{value}' {selected}>{label}</option>";
											var options="";
											
											for(var m = 0; m < currentSet.state.options.length; m++){
												options +=optionTag.replace("{value}", currentSet.state.options[m].value)
													.replace("{label}", currentSet.state.options[m].label)
													.replace("{selected}", currentSet.state.options[m].selected ? "selected":"");
											}

											$('[name="'+ $("select[name*='ic_")[n].name +'"]').append(options);

											
									//} //if(icName != $("select[name*='ic_")[n].name){
								}
								
								console.log("---------- ic data ----------");
							}
						});
					}
				}//if the report has input controls, continue processing
			}
		});
	});
}

function setFirstAndLastPageNumbers(lastPageNumber){
	if (lastPageNumber == 0)
		$("#currentPage").val(lastPageNumber);
	else
		$("#currentPage").val("1");
	$("#totalPages").val(lastPageNumber);
}

function clearListAndReportOutput(){
	$("#reportsList").empty();
	$("#report").empty();
	$("#ic").empty();
	$("#currentPage").val("");
	$("#totalPages").val("");
	report = "";
	$("#report").css("display",'none');
	$("#functCont").css("display",'none');
	$("#icCont").css("display",'none');
}

function manageFunctionalAndIcPanels(idArray, isVisible){
	$.each(idArray, function(index, value){
		console.log(value+" "+isVisible);
	});
	//$("#functCont").css("display","none");
	//$("#icCont").css("display","none");
}

$('#testSolution').click(function(){
		$("#btnPrevious").prop("disabled",true);
});

function runReportWithSelectedParams(){
visualize(
	function (v) {
		var jsonInfoAboutObject = $("#forIC").data('ri');
		
		$("#report").empty();
		
		var reportLocal = v.report({
				resource: jsonInfoAboutObject.uri,
				container: "#report",
				params: params_data,
				events: {
					reportCompleted: function(status){
						console.log("Report status "+status);
					},
					changeTotalPages: function(totalPages) {
						console.log("Total Pages:" + totalPages);
						setFirstAndLastPageNumbers(totalPages);
					}
				},
				error: function(error) {
						console.log("Report error "+error);
				}
			});
		report = reportLocal;
	});
}

$('#applyValue').click(function(){
	console.log("applyValue on click test method");
	runReportWithSelectedParams();
});