var GwentConfig = GwentConfig || {apiKey: '', language: ''};

var GwentTinyMCE = {
  config: {
    endpoint: 'https://www.gwentdb.hu/api/v1',
    language: GwentConfig.language,
    apiKey: GwentConfig.apiKey
  },
  // TinyMCE windowManager.
  popup: null,
  // Container for card thumbnails.
  container: null,
  // Selected items.
  selected: {
    version: 'latest',
    card: null
  },
  // Contains cards belong to selected version.
  data: []
};

(function ($) {
  'use strict';

  /**
   * Retrieves available versions.
   *
   * @param {function} callback
   *    On-success callback function.
   */
  GwentTinyMCE.getVersions = function (callback) {
    var endpoint = GwentTinyMCE.config.endpoint;
    var language = GwentTinyMCE.config.language;

    $.ajax({
      url: endpoint + '/versions?_format=json&language=' + language,
      type: "GET",
      beforeSend: function (xhr) {
        xhr.setRequestHeader('API-Key', GwentTinyMCE.config.apiKey);
      }
    }).done(function (response) {
      if (response.message == 'OK') {
        callback(response.data);
      } else {
        GwentTinyMCE.container.html(response.message);
      }
    }).error(function (request, status, error) {
      if (request['responseJSON']['message']) {
        GwentTinyMCE.container.html('<p class="error-message">' + request['responseJSON']['message'] + '</p>');
      } else {
        GwentTinyMCE.container.html('<p class="error-message">' + status + ' - ' + error + '</p>');
      }
    });
  };

  /**
   * Retrieves Gwent cards for a specific version.
   *
   * @param {string} version
   *    Version string.
   * @param {function} callback
   *    On-success callback function.
   */
  GwentTinyMCE.getCardsByVersion = function (version, callback) {
    var endpoint = GwentTinyMCE.config.endpoint;
    var language = GwentTinyMCE.config.language;

    $.ajax({
      url: endpoint + '/' + version + '/cards?_format=json&language=' + language,
      type: "GET",
      beforeSend: function (xhr) {
        xhr.setRequestHeader('API-Key', GwentTinyMCE.config.apiKey);
      }
    }).done(function (response) {
      if (response.message == 'OK') {
        callback(response.data);
      }
    }).error(function (request, status, error) {
      if (request['responseJSON']['message']) {
        GwentTinyMCE.container.html('<p class="error-message">' + request['responseJSON']['message'] + '</p>');
      } else {
        GwentTinyMCE.container.html('<p class="error-message">' + status + ' - ' + error + '</p>');
      }
    });
  };

  /**
   * List-builder function to build card list in TinyMCE popup window.
   *
   * @param {Array} data
   *    Array contains card data. Each item is a Gwent card.
   */
  GwentTinyMCE.listBuilder = function (data) {
    var $list = $('<ul></ul>');

    $.each(data, function (index, card) {
      var $item = $('<li></li>');
      var $link = $('<a></a>');
      var $image = $('<img/>');
      var $name = $('<p></p>');

      $link.attr('href', 'javascript:void(0);');
      $link.attr('data-hash', card['hash']);

      $link.on('click', function () {
        var $this = $(this);
        var hash = $this.data('hash');

        $('.card-thumbnail').removeClass('selected-card');
        $this.find('.card-thumbnail').addClass('selected-card');

        $.each(GwentTinyMCE.data, function (key, item) {
          if (item['hash'] == hash) {
            GwentTinyMCE.selected.card = item;
          }
        });
      });

      $name.html(card['name']);

      $image.addClass('card-thumbnail');
      $image.attr('src', card['variations'][0]['art']['mini']);
      $image.attr('width', '100');

      $image.appendTo($link);
      $name.appendTo($link);
      $link.appendTo($item);
      $item.appendTo($list);
    });

    GwentTinyMCE.container.attr('style', 'max-height: 500px; overflow: auto;');

    $list.appendTo(GwentTinyMCE.container);
  };

  /**
   * OnSelect callback function for TinyMCE windowManager 'Version' field.
   *
   * @param {object} field
   *    Field element.
   */
  GwentTinyMCE.fieldVersionOnSelectCallback = function (field) {
    // Update selected version.
    GwentTinyMCE.selected.version = field.value();
    // Empty container.
    GwentTinyMCE.container.html('');

    // Retrieve cards.
    GwentTinyMCE.getCardsByVersion(GwentTinyMCE.selected.version, function (data) {
      // Update local card storage.
      GwentTinyMCE.data = data;
      // Update card list.
      GwentTinyMCE.listBuilder(GwentTinyMCE.data);
    });
  };

  /**
   * OnPostRender callback function for TinyMCE windowManager 'Version' field.
   *
   * @param {object} field
   *    Field element.
   */
  GwentTinyMCE.fieldVersionOnPostRenderCallback = function (field) {
    // Retrieve available versions.
    GwentTinyMCE.getVersions(function (data) {
      $.each(data, function (index, version) {
        field['_values'].push({
          text: version,
          value: version
        });
      });
    });

    // Select the 'latest' item by default.
    field.value(GwentTinyMCE.selected.version);

    // Retrieve cards.
    GwentTinyMCE.getCardsByVersion(GwentTinyMCE.selected.version, function (data) {
      // Update local card storage.
      GwentTinyMCE.data = data;
      // Update card list.
      GwentTinyMCE.listBuilder(GwentTinyMCE.data);
    });

    // Store card container for later use.
    GwentTinyMCE.container = $('#gwent-cards-container');
  };

  /**
   * OnSubmit callback function for TinyMCE windowManager.
   *
   * @param {object} windowManager
   *    TinyMCE windowManager object.
   * @param {object} editor
   *    TinyMCE editor object.
   */
  GwentTinyMCE.windowManagerOnSubmitCallback = function (windowManager, editor) {
    var lang = GwentTinyMCE.config.language;
    var card = GwentTinyMCE.selected.card;
    var version = GwentTinyMCE.selected.version;

    // Insert content when the window form is submitted.
    editor.insertContent('<a href="#" class="gwentdb-card-tooltip-link" data-version="' + version + '" data-card="' + card.hash + '" data-language="' + lang + '">' + card.name + '</a>');
  };

  /**
   * TinyMCE plugin.
   */
  tinymce.PluginManager.add('gwentdb', function (editor, url) {
    // Add a button that opens a window.
    editor.addButton('gwentdb', {
      text: false,
      icon: 'gwentdb',
      tooltip: "GwentDB",
      onclick: function () {
        GwentTinyMCE.popup = editor.windowManager;
        GwentTinyMCE.popup.open({
          width: 960,
          height: 600,
          title: 'GwentDB',
          body: [
            {
              type: 'listbox',
              text: 'Version',
              label: 'Select a version',
              values: [{text: 'Latest', value: 'latest'}],
              onselect: function () {
                GwentTinyMCE.fieldVersionOnSelectCallback(this);
              },
              onPostRender: function () {
                GwentTinyMCE.fieldVersionOnPostRenderCallback(this);
              }
            },
            {
              type: 'container',
              name: 'container',
              html: '<div id="gwent-cards-container"></div>'
            }
          ],
          onsubmit: function () {
            GwentTinyMCE.windowManagerOnSubmitCallback(this, editor);
          }
        });
      }
    });
  });

})(jQuery);
