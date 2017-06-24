var GwentConfig = GwentConfig || {
    apiKey: '',
    language: '',
    translate: {}
  };

var GwentTinyMCE = {
  config: {
    endpoint: 'https://www.gwentdb.hu/api/v1',
    language: GwentConfig.language,
    apiKey: GwentConfig.apiKey
  },
  spinner: '<div class="gwent-loading-spinner"><div class="dot1"></div><div class="dot2"></div></div>',
  // TinyMCE windowManager.
  popup: null,
  // Container for card thumbnails.
  container: null,
  // Selected items.
  selected: {
    version: 'latest',
    category: '',
    faction: '',
    type: '',
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
    var url = endpoint + '/versions?_format=json&language=' + language;

    GwentTinyMCE.getRequest(url, callback);
  };

  /**
   * Retrieves available categories.
   *
   * @param {function} callback
   *    On-success callback function.
   */
  GwentTinyMCE.getCategories = function (callback) {
    var endpoint = GwentTinyMCE.config.endpoint;
    var language = GwentTinyMCE.config.language;
    var url = endpoint + '/categories?_format=json&language=' + language;

    GwentTinyMCE.getRequest(url, callback);
  };

  /**
   * Retrieves available factions.
   *
   * @param {function} callback
   *    On-success callback function.
   */
  GwentTinyMCE.getFactions = function (callback) {
    var endpoint = GwentTinyMCE.config.endpoint;
    var language = GwentTinyMCE.config.language;
    var url = endpoint + '/factions?_format=json&language=' + language;

    GwentTinyMCE.getRequest(url, callback);
  };

  /**
   * Retrieves available types.
   *
   * @param {function} callback
   *    On-success callback function.
   */
  GwentTinyMCE.getTypes = function (callback) {
    var endpoint = GwentTinyMCE.config.endpoint;
    var language = GwentTinyMCE.config.language;
    var url = endpoint + '/types?_format=json&language=' + language;

    GwentTinyMCE.getRequest(url, callback);
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
    var url = endpoint + '/' + version + '/cards?_format=json&language=' + language;

    GwentTinyMCE.getRequest(url, callback);
  };

  /**
   * GET request.
   *
   * @param {string} url
   *    Requested URL.
   * @param {function} callback
   *    On-success callback function.
   */
  GwentTinyMCE.getRequest = function (url, callback) {
    $.ajax({
      url: url,
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
      }
      else {
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
    GwentTinyMCE.container.html($list);
  };

  GwentTinyMCE.filterList = function () {
    // Clone data object in order to keep original results.
    var data = GwentTinyMCE.data;

    // Empty container.
    GwentTinyMCE.container.html(GwentTinyMCE.spinner);

    if (GwentTinyMCE.selected.category != '') {
      data = data.filter(function (item) {
        return ($.inArray(GwentTinyMCE.selected.category, item.category) != -1);
      });
    }

    if (GwentTinyMCE.selected.faction != '') {
      data = data.filter(function (item) {
        return (item.faction == GwentTinyMCE.selected.faction);
      });
    }

    if (GwentTinyMCE.selected.type != '') {
      data = data.filter(function (item) {
        return (item.type == GwentTinyMCE.selected.type);
      });
    }

    if (data.length === 0) {
      var text = GwentConfig.translate['No results...'] || 'No results...';
      var message = '<p class="error-message">' + text + '</p>';

      GwentTinyMCE.container.html(message);
    }
    else {
      GwentTinyMCE.listBuilder(data);
    }
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
    GwentTinyMCE.container.html(GwentTinyMCE.spinner);

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
    // Store card container for later use.
    GwentTinyMCE.container = $('#gwent-cards-container');

    GwentTinyMCE.container.html(GwentTinyMCE.spinner);

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
  };

  /**
   * OnPostRender callback function for TinyMCE windowManager 'Category' field.
   *
   * @param {object} field
   *    Field element.
   */
  GwentTinyMCE.fieldCategoryOnPostRenderCallback = function (field) {
    // Retrieve available categories.
    GwentTinyMCE.getCategories(function (data) {
      $.each(data, function (index, category) {
        field['_values'].push({
          text: category,
          value: category
        });
      });
    });
  };

  /**
   * OnPostRender callback function for TinyMCE windowManager 'Type' field.
   *
   * @param {object} field
   *    Field element.
   */
  GwentTinyMCE.fieldTypeOnPostRenderCallback = function (field) {
    // Retrieve available types.
    GwentTinyMCE.getTypes(function (data) {
      $.each(data, function (index, type) {
        field['_values'].push({
          text: type,
          value: type
        });
      });
    });
  };

  /**
   * OnPostRender callback function for TinyMCE windowManager 'Faction' field.
   *
   * @param {object} field
   *    Field element.
   */
  GwentTinyMCE.fieldFactionOnPostRenderCallback = function (field) {
    // Retrieve available factions.
    GwentTinyMCE.getFactions(function (data) {
      $.each(data, function (index, faction) {
        field['_values'].push({
          text: faction,
          value: faction
        });
      });
    });
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
          height: 570,
          title: 'GwentDB',
          classes: 'gwentdb-popup',
          body: [
            {
              type: 'container',
              layout: 'flow',
              items: [
                {
                  type: 'listbox',
                  text: GwentConfig.translate['Version'] || 'Version',
                  values: [
                    {
                      text: GwentConfig.translate['Latest'] || 'Latest',
                      value: 'latest'
                    }
                  ],
                  fixedWidth: true,
                  onselect: function () {
                    GwentTinyMCE.fieldVersionOnSelectCallback(this);
                  },
                  onPostRender: function () {
                    GwentTinyMCE.fieldVersionOnPostRenderCallback(this);
                  }
                },
                {
                  type: 'listbox',
                  text: GwentConfig.translate['Category'] || 'Category',
                  values: [
                    {
                      text: GwentConfig.translate['Any'] || 'Any',
                      value: ''
                    }
                  ],
                  fixedWidth: true,
                  onselect: function () {
                    GwentTinyMCE.selected.category = this.value();
                    GwentTinyMCE.filterList();
                  },
                  onPostRender: function () {
                    GwentTinyMCE.fieldCategoryOnPostRenderCallback(this);
                  }
                },
                {
                  type: 'listbox',
                  text: GwentConfig.translate['Faction'] || 'Faction',
                  values: [
                    {
                      text: GwentConfig.translate['Any'] || 'Any',
                      value: ''
                    }
                  ],
                  fixedWidth: true,
                  onselect: function () {
                    GwentTinyMCE.selected.faction = this.value();
                    GwentTinyMCE.filterList();
                  },
                  onPostRender: function () {
                    GwentTinyMCE.fieldFactionOnPostRenderCallback(this);
                  }
                },
                {
                  type: 'listbox',
                  text: GwentConfig.translate['Type'] || 'Type',
                  values: [
                    {
                      text: GwentConfig.translate['Any'] || 'Any',
                      value: ''
                    }
                  ],
                  fixedWidth: true,
                  onselect: function () {
                    GwentTinyMCE.selected.type = this.value();
                    GwentTinyMCE.filterList();
                  },
                  onPostRender: function () {
                    GwentTinyMCE.fieldTypeOnPostRenderCallback(this);
                  }
                },
                {
                  type: 'container',
                  name: 'container',
                  html: '<div id="gwent-cards-container"></div>'
                }
              ]
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
