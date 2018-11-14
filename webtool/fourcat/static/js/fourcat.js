//AJAX functions that retrieve user input and send it to the server so Python can do it's magic
$(function() {

	// global variables
	var loadedcsv = {}
	var obj_jsonimages = {}
	var timeout
	var query_key = null

	function start_query(){

		// Show loader
		$('.loader').show()

		// Get AJAX url from search options
		ajax_url = get_ajax_url()

		// Check if parameters are correct
		if (ajax_url !== false) {
			console.log(ajax_url)

			// AJAX the query to the server
			$.ajax({
				dataType: "text",
				url: ajax_url,
				success: function(response) {
					console.log(response);

					// If the query is rejected by the server.
					if (response.substr(0, 14) == 'Invalid query.') {
						$('.loader').hide()
						alert(response)
					}

					// If the query is accepted by the server.
					else{
						query_key = response
						poll_csv(query_key)

						// poll results every 2000 ms after submitting
						poll_interval = setInterval(function() {
							poll_csv(query_key);
						}, 4000);
					}
				},
				error: function(error) {
					console.log('error')
					console.log(error);
					$('#results').html('<h3>' +$('#dataselection option:selected').text() + " error</h3>")
					$('.loader').hide()
				}
			});
		}
		// If there's something wrong with the parameters, don't send a request
		else {
			$('.loader').hide()
		}

	}
	
	function poll_csv(query_key){
		/*
		Polls server to check whether there's a result for query
		*/
		$.ajax({
			dataType: "text",
			url: 'check_query/' + query_key,
			success: function(response) {
				console.log(response)

				// if the server hasn't processed the query yet, do nothing
				if (response == 'no_file') {
					// do nothing
				}

				// if there are no results in the database, notify user
				else if (response == 'empty_file') {
					clearInterval(poll_interval)
					$('.loader').hide()
					alert('No results for your search input.\nPlease edit search.')
				}

				// if the query succeeded, notify user
				else {
					clearInterval(poll_interval)
					$('#submitform').append('<a href="/result/' + response + '/"><p>' + response + '</p></a>')
					$('.loader').hide()
					alert('Query for \'' + response + '\' complete!')
				}
			},
			error: function(error) {
				console.log('Something went wrong when checking query status')
			}
		});
	}

	function get_ajax_url(){
		/*
		Takes the user input and generates an AJAX URL to send to Flask back-end.
		Parses date input to a unix timestamp and checks whether these are correct.
		Returns an error if not enough parameters are provided.
		*/

		var valid = true

		// Set board parameter
		var board = $('#board-select').val()

		// Set string parameters. Replace some potentially harmful characters.
		// Text in between * characters indicate exact match searches
		var url_body = $('#body-input').val().replace(/\"/g,"*");
		var url_subject = $('#subject-input').val().replace(/\"/g,"*");
		url_body = url_body.replace(/[^\p{L}A-Za-z0-9_*-]+/g,"-");
		url_subject = url_subject.replace(/[^\p{L}A-Za-z0-9_*-]+/g,"-");
		if(url_body == ''){url_body = 'empty'}
		if(url_subject == ''){url_subject = 'empty'}

		// Set full thread search parameter
		var url_full_thread
		if($('#check-full-thread').is(':checked') && url_body !== ''){url_full_thread = 1}
		else{url_full_thread = 0}

		// Set keyword-dense threads parameters
		var url_dense_threads = 0
		var url_dense_percentage = 0
		var url_dense_thread_length = 0
		if($('#check-dense-threads').is(':checked') && url_body !== ''){
			url_dense_threads = 1
			url_dense_percentage = $('#dense-percentage').val()
			url_dense_thread_length = $('#dense-thread-length').val()
		}

		// Set time parameters
		var url_min_date = 0
		var url_max_date = 0

		if($('#check-time').is(':checked')){
			var min_date = $('#input-min-time').val()
			var max_date = $('#input-max-time').val()

			// Convert the minimum date string to a unix timestamp
			if (min_date !== '') {
				url_min_date = stringToTimestamp(min_date)

				// If the string was incorrectly formatted (could be on Safari), a NaN was returned
				if (isNaN(url_min_date)) {
					valid = false
					alert('Please provide a minimum date in the format dd-mm-yyyy (like 29-11-2017).')
				}
			}

			// Convert the maximum date string to a unix timestamp
			if (max_date !== '' && valid) {
				url_max_date = stringToTimestamp(max_date)
				// If the string was incorrectly formatted (could be on Safari), a NaN was returned
				if (isNaN(url_max_date)) {
					valid = false
					alert('Please provide a maximum date in the format dd-mm-yyyy (like 29-11-2017).')
				}
			}

			// Input can be ill-formed, like '01-12-90', resulting in negative timestamps
			if (url_min_date < 0 || url_max_date < 0 && valid) {
				valid = false
				alert('Invalid date(s). Check the bar on top with details on date ranges of 4CAT data.')
			}

			// Make sure the first date is later than or the same as the second
			if (url_min_date >= url_max_date && url_min_date !== 0 && url_max_date !== 0 && valid) {
				valid = false
				alert('The first date is later than or the same as the second.\nPlease provide a correct date range.')
			}
		}
		
		// Create and return AJAX url only if the parameters are valid
		if (valid) {
			ajax_url = 'string_query/' + board + '/' + url_body + '/' + url_subject + '/' + url_full_thread + '/' + url_dense_threads + '/' + url_dense_percentage + '/' + url_dense_thread_length + '/' + url_min_date + '/' + url_max_date
			return ajax_url
		}
		else {
			return false
		}
	}

	function stringToTimestamp(str) {
		// Converts a text input to a unix timestamp.
		// Only used in Safari (other browsers use native HTML date picker)
		var date_regex = /^\d{4}-\d{2}-\d{2}$/
		if (str.match(date_regex)) {
			timestamp = (new Date(str).getTime() / 1000)
		}
		else {
			str = str.replace(/\//g,'-')
			str = str.replace(/\s/g,'-')
			var date_objects = str.split('-')
			var year = date_objects[2]
			var month = date_objects[1]
			// Support for textual months
			var testdate = Date.parse(month + "1, 2012");
			if(!isNaN(testdate)){
				month = new Date(testdate).getMonth() + 1;
			}
			var day = date_objects[0]
			timestamp = (new Date(year, (month - 1), day).getTime() / 1000)
		}
		return timestamp
	}

	/* BUTTON EVENT HANDLERS */

	// Start querying when go button is clicked
	$('#btn_go').bind('click', function(){
		start_query()
	});

	// Run query when return is pressed
	$('input').keyup(function(e){ 
		var code = e.which;
		if(code==13)e.preventDefault();
		if(code==13||code==188||code==186){
			$("#btn_go").click();
		}
	});

	// Enable date selection when 'filter on time' checkbox is checked
	/*$('#check-time').on('change', function(){
		if(this.checked){$('.input-time').attr('disabled', false)}
		else{$('.input-time').attr('disabled', true)}
	});*/

	// Change the option and label for keyword-dense threads according to body input
	$('#body-input').on('input', function(){
		input_string = $('#body-input').val()
		if (input_string == ''){
			$('.density-keyword').html('keyword')
			$('.input-dense').prop('disabled', true)
			$('#check-keyword-dense-threads').prop('checked', false)
		}
		else{
			$('.input-dense').prop('disabled', false)
			if (input_string.length > 7){
				$('.density-keyword').html(input_string.substr(0,4) + '...')
			}
			else{
				$('.density-keyword').html(input_string)
			}
		}
	});

	// Only enable full thread data option if subject is queried
	$('#subject-input').on('input', function(){
		if ($(this).val() == ''){
			$('#check-full-thread').prop('disabled', true)
			$('#check-full-thread').prop('checked', false)
		}
		else{
			$('#check-full-thread').prop('disabled', false)
		}
	});

	$('.input-dense').prop('disabled', true)
	$('#check-full-thread').prop('disabled', true)

});