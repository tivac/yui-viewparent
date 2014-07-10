/*jshint yui:true */
YUI.add("extension-view-parent", function(Y) {
    "use strict";
    
    var ViewParent;
    
    ViewParent = function() {};
    ViewParent.ATTRS = {
        children : {
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
            
            //catch initial values of chidlren ATTR
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
                css;
            
            if(!slot) {
                return;
            }
            
            css = Y.Array.dedupe([
                "child",
                name,
                view.name,
                slot.get("className")
            ]);
            
            view.render();
            
            slot.replace(
                view.get("container").addClass(css.join(" "))
            );
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
            var _this = this;
            
            Y.Object.each(e.newVal, function(view, name) {
                // Instantiate any views that are just function references
                if(typeof view === "function") {
                    e.newVal[name] = new view({
                        parent : _this
                    });

                    view = e.newVal[name];
                }

                // Check for a stamp (meaning we've process this view instance already)
                if(Y.stamp(view, true)) {
                    return;
                }
                
                Y.stamp(view);
                view.set("parent", _this);
                view.addTarget(_this);
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
