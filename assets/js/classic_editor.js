jQuery( document ).ready( function( $ ) {
  console.log('Classic editor unfluff script loaded.');
  // get unfluff data from local variables
  let img_dir = unfluff_data.img_dir,
      email = unfluff_data.email,
      license = unfluff_data.license;
  let loading_effect = null;

  function unfluff_call() {
    let editor_content = '';
    if($('#wp-content-wrap').hasClass('html-active')){ // We are in text mode
        //editor_content = $('#content').val(); // get the textarea's content
        $('body').append('<div id="unfluff-notice" class="notice notice-warning is-dismissible"><p>Unfluff works with the visual editor only! Please switch to the visual editor and click the unfluff button again.</p></div>');
        return;
    } else { // We are in tinyMCE mode
        editor_content = tinymce.get('content').getContent();; // get tinyMCE's content
    }
    // return if no content
    if(!editor_content){
      console.log('no content');
      clearInterval(loading_effect);
      return;
    }
    
    var settings = {
        'url': 'https://backend.unfluff.io/unfluff',
        'method': 'POST',
        'timeout': 0,
        'headers': {
          'Content-Type': 'application/json'
        },
        'data': JSON.stringify({
          'content': editor_content,
          'email': email,
          'license': license
        }),
      };
      
      $('#unfluff-score-value').text('Loading...');
      $('#unfluff-actions .gauge').css('background-color', '#ccc'); //rest 
      $.ajax(settings).done(function (response) {
        // check if license is valid
        if(response.error){
          console.log('invalid license');
          $('#unfluff-score-value').text('--');
          $('#unfluff-actions').addClass('unfluff-invliad-license');
          $('#fluff-sentences').text('Invalid license key! Go to the unfluff settings page to update your license key.');
          clearInterval(loading_effect);
          return;
        }
        // stop loading effect
        clearInterval(loading_effect);
        $('#cat-img').removeClass('cat-transform');
        let unfluff_score = 100 - response.fluff;
        $('#unfluff-score-value').text(unfluff_score + '%');
        // show value on guage
        $('#unfluff-actions .gauge .percentage').css('transform', 'rotate(' + unfluff_score * 180 / 100 + 'deg)');
        // guage percentage colors and images
        if(unfluff_score <= 50) {
          $('#unfluff-actions .gauge').css('background-color', 'red');
          $('#cat-img').attr('src', img_dir + '50.png');
        } else if(unfluff_score <= 65) {
          $('#unfluff-actions .gauge').css('background-color', 'orange');
          $('#cat-img').attr('src', img_dir + '65.png');
        } else if(unfluff_score <= 85) {
          $('#unfluff-actions .gauge').css('background-color', 'rgb(255 221 0)');
          $('#cat-img').attr('src', img_dir + '85.png');
        } else{
          $('#unfluff-actions .gauge').css('background-color', 'green');
          $('#cat-img').attr('src', img_dir + '100.png');
        }
        //console.log(response.results.length);
        let sentences = response.results;
        if(sentences.length > 0){
          for (let i = 0; i < sentences.length; ++i) {
            //console.log(sentences[i].sentence);
            // show fluff sentences inside the metabox
            $('#fluff-sentences').append($('<div class="fluff-sentence"><span class="fulff-sentence-text">' + sentences[i].sentence + '</span><span class="unfluff-single-highlight">Find</span></div>'));
          }  
        } else {
          $('#unfluff-highlight-show').addClass('unfluff-hide');
          $('#fluff-sentences').text('No fluff sentences were found. Great Job!');
        }
      }).fail(function(data) {
        $('#unfluff-score-value').text('Something went wrong!');
      });

  } 

  // get announcements
  function announcement_call() {
    var ann_settings = {
      'url': 'https://unfluff.io/wp-json/unfluff/ann',
      'method': 'GET',
      'timeout': 0
    };
    
    $.ajax(ann_settings).done(function (response) {
      let active = response.active;
      let ann_html = response.html;
      if( active == 'yes'){
        $('#unfluff-announcement').addClass('unfluff-announcement');
        $('#unfluff-announcement').html(ann_html);
      }
    });
  }

  // text to html markup function
  function ConvertStringToHTML(str) {
    let parser = new DOMParser();
    let doc = parser.parseFromString(str, 'text/html');
    return doc.body;
  }

  // highlight function 
  function show_highlights(){
    //highlight fluff sentences inside the classic editor
    let highlighted_content = '';
    if($('#wp-content-wrap').hasClass('html-active')){ // We are in text mode
      alert('Unfluff works with the visual editor only! Please switch to the visual editor and click the unfluff button again.');
    } else { // We are in tinyMCE mode
        let post_editor = tinymce.get('content');
        if(post_editor){ // Make sure we're not calling setContent on null
          highlighted_content = post_editor.getContent(); // get tinyMCE's content
          $('.fluff-sentence .fulff-sentence-text').each(function(i, obj) {
            let fluff_sentence = $(this).text();
            if(highlighted_content.indexOf(fluff_sentence) >= 0) { // text exists without html tags 
              //console.log('Found:   ' + fluff_sentence);
              highlighted_content = highlighted_content.replaceAll( fluff_sentence, '<unfluffmark class="unfluff-highlight">' + fluff_sentence + '</unfluffmark>');
            } else{ // text has html tags, or maybe does not exist!!!
              //console.log('Not found:   ' + fluff_sentence);
              // covvert Active editor string to html markup
              let editor_html = ConvertStringToHTML(highlighted_content);
              let sentence_with_html = $(editor_html).find("p:contains('" + fluff_sentence + "'), div:contains('" + fluff_sentence + "'), span:contains('" + fluff_sentence + "')");
              sentence_with_html = sentence_with_html.html();
              highlighted_content = highlighted_content.replaceAll( sentence_with_html, '<unfluffmark class="unfluff-highlight">' + sentence_with_html + '</unfluffmark>');
            }
          });
          post_editor.setContent(highlighted_content); // Update tinyMCE's content
          $(post_editor.getBody()).find('unfluffmark').get(0).scrollIntoView({behavior: "smooth", block: "center", inline: "center"}); // scroll to first highlighted sentence
        }
    }   
  }

  // remove highlight functions
  function remove_highlights(){
    //unhighlight fluff sentences inside the classic editor
    let unhighlighted_content = '';
    if($('#wp-content-wrap').hasClass('html-active')){ // We are in text mode
      alert('Unfluff works with visual editor only! Please switch to visual editor and click the unfluff button again.');
    } else { // We are in tinyMCE mode
        let post_editor = tinyMCE.get('content');
        if(post_editor!==null){ // Make sure we're not calling setContent on null
            unhighlighted_content = post_editor.getContent(); // get tinyMCE's content
            unhighlighted_content = unhighlighted_content.replaceAll( '<unfluffmark class="unfluff-highlight">', '' );
            unhighlighted_content = unhighlighted_content.replaceAll( '</unfluffmark>', '' );
            post_editor.setContent(unhighlighted_content); // Update tinyMCE's content
        }
    }   
  }

  // single sentence find/highlight function
  function unfluff_single_highlight(sentence){
    remove_highlights(); // remove previous highlights if any
    let post_editor = tinyMCE.get('content');
    let editor_content = post_editor.getContent();
    let single_higlight = '';
    if (editor_content.indexOf(sentence) >= 0) { // text exists without html tags 
      single_higlight = editor_content.replaceAll( sentence, '<unfluffmark class="unfluff-highlight">' + sentence + '</unfluffmark>');
    } else{ // text has html tags, or maybe does not exist!!!
      // covvert Active editor string to html markup
      let editor_html = ConvertStringToHTML(editor_content);
      let sentence_with_html = $(editor_html).find("p:contains('" + fluff_sentence + "'), div:contains('" + fluff_sentence + "'), span:contains('" + fluff_sentence + "')");
      sentence_with_html = sentence_with_html.html(); console.log(sentence_with_html);
      single_higlight = editor_content.replaceAll( sentence_with_html, '<unfluffmark class="unfluff-highlight">' + sentence_with_html + '</unfluffmark>');
    }
    post_editor.setContent(single_higlight); // Update tinyMCE's content
    $(post_editor.getBody()).find('unfluffmark').get(0).scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
  }

  function unfluff_reset(){
    $('#unfluff-score-value').text('--');
    $('#cat-img').attr('src', img_dir + 'waiting.png');
    clearInterval(loading_effect);
    loading_effect = setInterval(cat_loading_effect, 200);
    $('#unfluff-actions .gauge').css('background-color', '');
    $('#unfluff-highlight-remove').addClass('unfluff-hide');
    $('#unfluff-highlight-show').removeClass('unfluff-hide');
    $('#fluff-sentences').empty();
  }

  // unfluff check loading effect
  function cat_loading_effect() {
    if($('#cat-img').hasClass('cat-transform')){
      $('#cat-img').removeClass('cat-transform');
    } else{
      $('#cat-img').addClass('cat-transform');
    }
  }

  // call unfluff on load
  unfluff_call();
  announcement_call();

  // run the unfluff check 
  $('#unfluff-check').click(function(){
    if($('#wp-content-wrap').hasClass('html-active')){ // We are in text mode
      alert('Unfluff works with visual editor only! Please switch to visual editor and click the unfluff button again.');
    } else { // We are in tinyMCE mode
      remove_highlights(); // remove exsiting highlights.
      unfluff_reset(); // reset everything first
      unfluff_call();
    }
  }); 

  // highlight fluff in editor
  $('#unfluff-highlight-show').click(function(){
    $(this).addClass('unfluff-hide');
    $('#unfluff-highlight-remove').removeClass('unfluff-hide');
    show_highlights();
  });

  // remove highlights from editor
  $('#unfluff-highlight-remove').click(function(){
    $(this).addClass('unfluff-hide');
    $('#unfluff-highlight-show').removeClass('unfluff-hide');
    remove_highlights();
  });

  // find and highlight single sentence
  $('#fluff-sentences').on('click', '.unfluff-single-highlight', function() {
    let single_sentence = $(this).parent().find('.fulff-sentence-text').text();
    //console.log(single_sentence);
    unfluff_single_highlight(single_sentence);
  });

  // remove highlights in update hover
  $('#publishing-action').on('mouseover', '#publish',function(){
    let post_editor = tinyMCE.get('content').getContent();
    let highlight_mark = '<unfluffmark class="unfluff-highlight">'
    if(post_editor.indexOf(highlight_mark) >= 0) { // text exis 
      remove_highlights();
      $('#unfluff-highlight-remove').addClass('unfluff-hide');
      $('#unfluff-highlight-show').removeClass('unfluff-hide');
    }
  });

});