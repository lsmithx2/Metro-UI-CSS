var Splitter = {
    init: function( options, elem ) {
        this.options = $.extend( {}, this.options, options );
        this.elem  = elem;
        this.element = $(elem);

        this._setOptionsFromDOM();
        this._create();

        return this;
    },

    options: {
        splitMode: "horizontal", // horizontal or vertical
        splitSizes: null,
        gutterSize: 4,
        minSizes: null,
        children: "*",
        gutterClick: "expand", // expand or collapse
        onResizeStart: Metro.noop,
        onResizeStop: Metro.noop,
        onResizeSplit: Metro.noop,
        onSplitterCreate: Metro.noop
    },

    _setOptionsFromDOM: function(){
        var that = this, element = this.element, o = this.options;

        $.each(element.data(), function(key, value){
            if (key in o) {
                try {
                    o[key] = JSON.parse(value);
                } catch (e) {
                    o[key] = value;
                }
            }
        });
    },

    _create: function(){
        var that = this, element = this.element, o = this.options;

        this._createStructure();
        this._createEvents();

        Utils.exec(o.onCreate, [element]);
    },

    _createStructure: function(){
        var that = this, element = this.element, o = this.options;
        var children = element.children(o.children).addClass("split-block");
        var i, children_sizes = [];
        var gutters, resizeProp = o.splitMode === "horizontal" ? "width" : "height";

        if (!Utils.isValue(element.attr("id"))) {
            element.attr("id", Utils.elementId("splitter"));
        }

        element.addClass("splitter");
        if (o.splitMode.toLowerCase() === "vertical") {
            element.addClass("vertical");
        }

        for (i = 0; i < children.length - 1; i++) {
            $("<div>").addClass("gutter").css(resizeProp, o.gutterSize).insertAfter($(children[i]));
        }

        gutters = element.children(".gutter");

        if (!Utils.isValue(o.splitSizes)) {
            children.css({
                flexBasis: "calc("+(100/children.length)+"% - "+(gutters.length * o.gutterSize)+"px)"
            })
        } else {
            children_sizes = Utils.strToArray(o.splitSizes);
            for(i = 0; i < children_sizes.length; i++) {
                $(children[i]).css({
                    flexBasis: "calc("+children_sizes[i]+"% - "+(gutters.length * o.gutterSize)+"px)"
                });
            }
        }

        if (Utils.isValue(o.minSizes)) {
            if (String(o.minSizes).contains(",")) {
                children_sizes = Utils.strToArray(o.minSizes);
                for (i = 0; i < children_sizes.length; i++) {
                    $(children[i]).data("min-size", children_sizes[i]);
                }
            } else {
                $.each(children, function(){
                    this.style.setProperty('min-'+resizeProp, String(o.minSizes).contains("%") ? o.minSizes : String(o.minSizes).replace("px", "")+"px", 'important');
                });
            }
        }
    },

    _createEvents: function(){
        var that = this, element = this.element, o = this.options;
        var gutters = element.children(".gutter");

        gutters.on(Metro.events.start, function(e){
            var w = o.splitMode === "horizontal" ? element.width() : element.height();
            var gutter = $(this);
            var prev_block = gutter.prev(".split-block");
            var next_block = gutter.next(".split-block");
            var prev_block_size = 100 * (o.splitMode === "horizontal" ? prev_block.outerWidth(true) : prev_block.outerHeight(true)) / w;
            var next_block_size = 100 * (o.splitMode === "horizontal" ? next_block.outerWidth(true) : next_block.outerHeight(true)) / w;
            var start_pos = Utils.getCursorPosition(element, e);

            gutter.addClass("active");

            Utils.exec(o.onResizeStart, [start_pos, gutter, prev_block, next_block], element);

            $(window).on(Metro.events.move + "-" + element.attr("id"), function(e){
                var pos = Utils.getCursorPosition(element, e);
                var new_pos;

                if (o.splitMode === "horizontal") {
                    new_pos = (pos.x * 100 / w) - (start_pos.x * 100 / w);

                } else {
                    new_pos = (pos.y * 100 / w) - (start_pos.y * 100 / w);
                }

                prev_block.css("flex-basis", "calc(" + (prev_block_size + new_pos) + "% - "+(gutters.length * o.gutterSize)+"px)");
                next_block.css("flex-basis", "calc(" + (next_block_size - new_pos) + "% - "+(gutters.length * o.gutterSize)+"px)");

                Utils.exec(o.onResizeSplit, [pos, gutter, prev_block, next_block], element);
            });

            $(window).on(Metro.events.stop + "-" + element.attr("id"), function(e){

                gutter.removeClass("active");

                $(window).off(Metro.events.move + "-" + element.attr("id"));
                $(window).off(Metro.events.stop + "-" + element.attr("id"));

                Utils.exec(o.onResizeStop, [Utils.getCursorPosition(element, e), gutter, prev_block, next_block], element);
            })
        });
    },

    changeAttribute: function(attributeName){

    },

    destroy: function(){}
};

Metro.plugin('splitter', Splitter);