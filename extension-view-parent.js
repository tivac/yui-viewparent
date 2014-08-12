YUI.add("extension-view-parent", function(Y) {
    "use strict";
    
    var ViewParent = function() {},
        classRegex = /\s+/;
    
    ViewParent.ATTRS = {
        children  : {
            value : false
        }
    };
    
    ViewParent.prototype = {
        initializer : function() {
            this._viewParentHandles = [
                //Make sure new child views bubble
                this.on("childrenChange", this._childrenChange, this),
                
                //Stick children into rendered DOM after the parent has rendered itself
                Y.Do.after(this.renderChildren, this, "render", this)
            ];

            //catch initial values of views ATTR
            this._childrenChange({
                newVal : this.get("children")
            });
        },
        
        //destroy child views & clean up all handles
        destructor : function() {
            Y.Object.each(this.get("children"), function(view) {
                view.destroy();
            });
            
            new Y.EventTarget(this._viewParentHandles).detach();
            
            this._viewParentHandles = null;
        },
        
        renderChild : function(name, view) {
            var parent = this.get("container"),
                slot   = parent.one("[data-child=\"" + name + "\"]"),
                el, classes, css;
            
            if(!slot) {
                return;
            }
            
            view.render();

            el      = view.get("container");
            classes = el.get("className");

            // Ensure we don't double up on any classes
            css = [ "child", name, view.name ].concat(slot.get("className").split(classRegex));
            css = Y.Array.dedupe(css).filter(function(str) {
                return str.length || classes.indexOf(str) === -1;
            });

            if(css.length) {
                el.addClass(css.join(" "));
            }
            
            slot.replace(el);
        },
        
        //render all the child views & inject them into the placeholders
        renderChildren : function() {
            var children = this.get("children"),
                name;
            
            if(!children) {
                return;
            }
            
            this.get("container").addClass("parent");
            
            for(name in children) {
                this.renderChild(name, children[name]);
            }
        },
        
        //make sure custom events from child views bubble to parent view
        _childrenChange : function(e) {
            var self = this,
                id   = Y.stamp(this);
            
            Y.Object.each(e.newVal, function(view) {
                if(id in view) {
                    return;
                }

                view[id] = true;
                
                view.set("parent", self);
                view.addTarget(self);
            });
        }
    };
    
    Y.namespace("Extensions").ViewParent = ViewParent;
    
}, "@VERSION@", {
    requires : [
        "view",
        "event-custom"
    ]
});
