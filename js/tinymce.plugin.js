var GwentConfig = GwentConfig || {apiKey: '', language: ''};

var GwentClient = {
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
  GwentClient.getVersions = function (callback) {
    var endpoint = GwentClient.config.endpoint;
    var language = GwentClient.config.language;

    $.ajax({
      url: endpoint + '/versions?_format=json&language=' + language,
      type: "GET",
      beforeSend: function (xhr) {
        xhr.setRequestHeader('API-Key', GwentClient.config.apiKey);
      }
    }).done(function (response) {
      if (response.message == 'OK') {
        callback(response.data);
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
  GwentClient.getCardsByVersion = function (version, callback) {
    var endpoint = GwentClient.config.endpoint;
    var language = GwentClient.config.language;

    $.ajax({
      url: endpoint + '/' + version + '/cards?_format=json&language=' + language,
      type: "GET",
      beforeSend: function (xhr) {
        xhr.setRequestHeader('API-Key', GwentClient.config.apiKey);
      }
    }).done(function (response) {
      if (response.message == 'OK') {
        callback(response.data);
      }
    });
  };

  /**
   * List-builder function to build card list in TinyMCE popup window.
   *
   * @param {Array} data
   *    Array contains card data. Each item is a Gwent card.
   *
   * @todo remove inline styles, use css file instead.
   */
  GwentClient.listBuilder = function (data) {
    var $list = $('<ul></ul>');

    $.each(data, function (index, card) {
      var $item = $('<li></li>');
      var $link = $('<a></a>');
      var $image = $('<img/>');
      var $name = $('<p></p>');

      $item.attr('style', 'display: block; float: left; width: 140px; overflow: hidden;');

      $link.attr('href', 'javascript:void(0);');
      $link.attr('data-hash', card['hash']);
      $link.on('click', function () {
        var $this = $(this);
        var hash = $this.data('hash');

        $('.card-thumbnail')
          .removeClass('selected-card')
          .css('background-color', '#cccccc');

        $this.find('.card-thumbnail')
          .addClass('selected-card')
          .css('background-color', '#dcb000');

        $.each(GwentClient.data, function (key, item) {
          if (item['hash'] == hash) {
            GwentClient.selected.card = item;
          }
        });
      });

      $name.html(card['name']);
      $name.attr('style', 'display: block; text-align: center; font-size: 12px;');

      $image.addClass('card-thumbnail');
      $image.attr('src', card['variations'][0]['art']['mini']);
      $image.attr('width', '100');
      $image.attr('style', 'width: 100px; height: 123px; display: block; margin-left: auto; margin-right: auto; text-align: center; padding: 0 5px 5px 0; background-color: #cccccc;');

      $image.appendTo($link);
      $name.appendTo($link);
      $link.appendTo($item);
      $item.appendTo($list);
    });

    GwentClient.container.attr('style', 'max-height: 500px; overflow: auto;');

    $list.appendTo(GwentClient.container);
  };

  /**
   * OnSelect callback function for TinyMCE windowManager 'Version' field.
   *
   * @param {object} field
   *    Field element.
   */
  GwentClient.fieldVersionOnSelectCallback = function (field) {
    // Update selected version.
    GwentClient.selected.version = field.value();
    // Empty container.
    GwentClient.container.html('');

    // Retrieve cards.
    GwentClient.getCardsByVersion(GwentClient.selected.version, function (data) {
      // Update local card storage.
      GwentClient.data = data;
      // Update card list.
      GwentClient.listBuilder(GwentClient.data);
    });
  };

  /**
   * OnPostRender callback function for TinyMCE windowManager 'Version' field.
   *
   * @param {object} field
   *    Field element.
   */
  GwentClient.fieldVersionOnPostRenderCallback = function (field) {
    // Retrieve available versions.
    GwentClient.getVersions(function (data) {
      $.each(data, function (index, version) {
        field['_values'].push({
          text: version,
          value: version
        });
      });
    });

    // Select the 'latest' item by default.
    field.value(GwentClient.selected.version);

    // Retrieve cards.
    GwentClient.getCardsByVersion(GwentClient.selected.version, function (data) {
      // Update local card storage.
      GwentClient.data = data;
      // Update card list.
      GwentClient.listBuilder(GwentClient.data);
    });

    // Store card container for later use.
    GwentClient.container = $('#gwent-cards-container');
  };

  /**
   * OnSubmit callback function for TinyMCE windowManager.
   *
   * @param {object} windowManager
   *    TinyMCE windowManager object.
   * @param {object} editor
   *    TinyMCE editor object.
   */
  GwentClient.windowManagerOnSubmitCallback = function (windowManager, editor) {
    var lang = GwentClient.config.language;
    var card = GwentClient.selected.card;
    var version = GwentClient.selected.version;

    // Insert content when the window form is submitted.
    editor.insertContent('<a href="#" class="gwentdb-card-tooltip-link" data-version="' + version + '" data-card="' + card.hash + '" data-language="' + lang + '">' + card.name + '<div class="gwentdb-card-tooltip"></div></a>');
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
        GwentClient.popup = editor.windowManager;
        GwentClient.popup.open({
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
                GwentClient.fieldVersionOnSelectCallback(this);
              },
              onPostRender: function () {
                GwentClient.fieldVersionOnPostRenderCallback(this);
              }
            },
            {
              type: 'container',
              name: 'container',
              html: '<div id="gwent-cards-container"></div>'
            }
          ],
          onsubmit: function () {
            GwentClient.windowManagerOnSubmitCallback(this, editor);
          }
        });
      }
    });
  });

})(jQuery);
