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
	});
}

function navigateNextPage(){
	visualize(
		function (v) {
		var currentPage = report.pages() || 1;
		report
		.pages(++currentPage)
		.run()
		.fail(function(err) { alert(err); });	
	});
}

function navigatePreviousPage(){
	visualize(
		function (v) {
		var currentPage = report.pages() || 1;
		report
		.pages(--currentPage)
		.run()
		.fail(function(err) { alert(err); });	
	});
}

function navigateLastPage(){
	visualize(
		function (v) {
		var currentPage = report.pages() || 1;
		report
		.pages(totalPages)
		.run()
		.fail(function(err) { alert(err); });	
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
				server : "http://localhost:8630/jasperserver-pro",
				//server : "http://10.98.51.108:8630/jasperserver-pro", 
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
			//server:"http://10.98.51.108:8630/jasperserver-pro",
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
				container: "#report",
				events: {
					reportCompleted: function(status){
						console.log("Report status "+status);
					},
					changeTotalPages: function(totalPages) {
						console.log("Total Pages:" + totalPages);
						setFirstAndLastPageNumbers(1, totalPages);
					}
				},
				error: function(error) {
						console.log("Report error "+error);
				}
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
				container: "#report",
				events: {
					reportCompleted: function(status){
						console.log("Report status "+status);
					},
					changeTotalPages: function(totalPages) {
						console.log("Total Pages:" + totalPages);
						setFirstAndLastPageNumbers(1, totalPages);
					}
				},
				error: function(error) {
						console.log("Report error "+error);
				}
			});
		});	
}

function setFirstAndLastPageNumbers(firstPageNumber, lastPageNumber){
	$("#currentPage").val(firstPageNumber);
	$("#totalPages").val(lastPageNumber);
}

function clearListAndReportOutput(){
	$("#reportsList").empty();
	$("#report").empty();
	
}

function manageFunctionalAndIcPanels(idArray, isVisible){
	$.each(idArray, function(index, value){
		console.log(value+" "+isVisible);
	});
	//$("#functCont").css("display","none");
	//$("#icCont").css("display","none");
}



$('#applyValue').click(function(){
	console.log("applyValue on click test method");
	//manageFunctionalAndIcPanels(["one","two"], "false");
	/*
	var template = "<label>{label}</label><p><select id='customerId'>{options}</select><br>",
	content = template.replace("{label}", control.label).replace("{options}", buildOptions(control.state.options));
	$("#contInputControl").append($(content));
	*/
	
visualize(
	function (v) {	
		var ic = v.inputControls({
			resource: "/organizations/organization_1/adhoc/topics/Cascading_multi_select_topic",
			success: function(data) {
				var icDefinition = "";
				for(var i = 0; i < data.length; i++){
					//console.log(data[i]);
					switch(data[i].type) {
					//var template = "<p><a href='#' class='resourceItem' data-ri='{data}' >{reportName}</a></p>";
			        //reportsList+=template.replace("{data}", JSON.stringify(control)).replace("{reportName}", control.label);
						case 'singleSelect':
							var icTemplate="<div id='cont_{id}' ><p>{description}</p>{ic}</div>";
							var icTag="<select name='ic_{inputControlId}' data-slave='{data}' data-master='{master}' data-type={type}>{options}</select>;";
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
							//console.log(ic);
							$("#ic").append(ic);							
						break;
						case 'multiSelect':
							var icTemplate="<div id='cont_{id}'><p>{description}</p>{ic}</div>";
							var icTag="<select name='ic_{inputControlId}' data-slave='{data}' data-master='{master}' data-type={type} multiple>{options}</select>;";
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
					} 
				}

				//bind onChange events to appropriate input controls
				for(var m = 0; m < data.length; m++){
					console.log(data[m]);
					$(document).on('change', "select[name*='ic_"+data[m].id+"']", function(){
							var icName = $(this).attr('name');
						
							var params_data = {};
							
							//current ic
							if($(this).data('type') == 'multiSelect'){							
								params_data[$(this).attr('name').substring(3)] = $(this).val();
							}
							else if ($(this).data('type') == 'singleSelect'){
								params_data[$(this).attr('name').substring(3)] = [$(this).val()];
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
							}
							
							
							/*
							for(var n = 0; n < $(this).data('slave').length; n++){
							    console.log("ic name "+ 'ic_'+$(this).data('slave')[n]);
								console.log("ic value "+ $("select[name*='ic_"+$(this).data('slave')[n]+"']").val());
								if($(this).data('type') == 'multiSelect'){							
									params_data[$(this).data('slave')[n]] = $("select[name*='ic_"+$(this).data('slave')[n]+"']").val();
								}
								else if ($(this).data('type') == 'singleSelect'){
									params_data[$(this).data('slave')[n]] = [$("select[name*='ic_"+$(this).data('slave')[n]+"']").val()];
								}
							}
							*/
							
							var reportUri = "/public/SME/Cascading_multi_select_topic";
							//var report = v.report({ resource: reportUri, container: "#report"});
							
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
								//console.log(JSON.stringify(data));

								console.log($("select[name*='ic_").length);

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
							
							//var report = v.report({ resource: reportUri, container: "#forIC" });
							var report = v.report({ resource: reportUri, container: "#report" });
							console.log("params data before rendering");
							console.log(JSON.stringify(params_data));
							console.log("params data before rendering");
							report.params(params_data);
							report.run();
							
							/*
							for(var n = 0; n < $(this).data('slave').length; n++){
							    console.log("ic name "+ 'ic_'+$(this).data('slave')[n]);
								console.log("ic value "+ $("select[name*='ic_"+$(this).data('slave')[n]+"']").val());
								params_data[$(this).data('slave')[n]] = [$("select[name*='ic_"+$(this).data('slave')[n]+"']").val()];
							}
							*/
							
							//params_data[$(this).data('slave')[0]] = [$("select[name*='ic_"+$(this).data('slave')[0]+"']").val()];
							//params_data[$(this).data('slave')[1]] = $("select[name*='ic_"+$(this).data('slave')[1]+"']").val();
							
					});
					/*
					$("#ic_"+data[m].id).on("change", function() {
						//report.params({ "Product_Family": [$(this).val()] }).run();
						alert("change should be applied to "+data[m].slaveDependencies);
					});
					*/
					

				}
			}
		}); //
	});			
});