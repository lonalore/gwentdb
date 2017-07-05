var GwentConfig = GwentConfig || {apiKey: '', language: '', translate: {}};

var GwentClient = {
  config: {
    endpoint: 'https://www.gwentdb.hu/api/v1',
    language: GwentConfig.language,
    apiKey: GwentConfig.apiKey
  },
  // Contains cards.
  data: {},
  tooltip: null
};

(function ($) {
  'use strict';

  /**
   * Retrieves a Gwent card.
   *
   * @param {string} version
   *    Version string.
   * @param {string} hash
   *    Hash string of the card.
   * @param {string} lang
   *    ISO language code.
   * @param {Function} callback
   *    Success callback function.
   */
  GwentClient.getCard = function (version, hash, lang, callback) {
    var endpoint = GwentClient.config.endpoint;
    var language = lang || GwentClient.config.language;

    var cache_id = version + hash + lang;
    var cached = false;

    $.each(GwentClient.data, function (index, value) {
      if (index == cache_id) {
        cached = true;
        callback(value);
      }
    });

    if (cached === false) {
      $.ajax({
        url: endpoint + '/' + version + '/cards/' + hash + '?_format=json&language=' + language,
        type: "GET",
        beforeSend: function (xhr) {
          xhr.setRequestHeader('API-Key', GwentClient.config.apiKey);
        }
      }).done(function (response) {
        if (response.message == 'OK') {
          GwentClient.data[cache_id] = response.data;

          callback(response.data);
        }
      }).error(function (request, status, error) {
        if (request['responseJSON']['message']) {
          alert(request['responseJSON']['message']);
        }
        else {
          alert(status + ' - ' + error);
        }
      });
    }
  };

  /**
   * Build Gwent Card Popover.
   *
   * @param {object} event
   *    Mouse over event.
   * @param {object} $link
   *    Link object, which was triggered.
   * @param {object} data
   *    Contains Card details.
   */
  GwentClient.buildPopover = function (event, $link, data) {
    var $body = $('body');

    var $container = $('<div></div>');
    var $image = $('<img/>');
    var $text = $('<div>');
    var $name = $('<div>');
    var $info = $('<div>');

    $image.attr('src', data['variations'][0]['art']['thumbnail']);
    $image.attr('alt', data['name']);

    $name.html(data['name']);
    $info.html(data['info']);

    $container.addClass('gwentdb-card-tooltip');
    $text.addClass('text');
    $name.addClass('name');
    $info.addClass('info');

    $name.appendTo($text);
    $info.appendTo($text);

    $image.appendTo($container);
    $text.appendTo($container);

    GwentClient.tooltip = $container;
    GwentClient.tooltip.appendTo($body);

    GwentClient.tooltip.css({
      position: 'absolute',
      top: event.pageY,
      left: event.pageX
    });
  };

  $(document).ready(function () {
    $('.gwentdb-card-tooltip-link').on({
      click: function () {
        return false;
      },
      mouseenter: function (event) {
        if (GwentClient.tooltip === null) {
          var $this = $(this);

          var vers = $this.data('version');
          var hash = $this.data('card');
          var lang = $this.data('language');

          GwentClient.getCard(vers, hash, lang, function (data) {
            GwentClient.buildPopover(event, $this, data);
          });
        }
      },
      mousemove: function (event) {
        if (GwentClient.tooltip) {
          GwentClient.tooltip.css({
            top: event.pageY,
            left: event.pageX
          });
        }
      },
      mouseleave: function (event) {
        if (GwentClient.tooltip) {
          GwentClient.tooltip.remove();
        }

        GwentClient.tooltip = null;
      }
    });
  });

})(jQuery);
