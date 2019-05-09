'use strict';

/**
   Operations:
   - Open/Close editor in top bar
    - PLI always shown when editor opened
    - and parts shown individually
   - modify step rotation: ABS,REL, x, y, z --- 2 buttons + 3*3 inputs
   - Remove highlighted parts --- 1 button
   - save --- 1 button
   Operations on TODO-list:
   - add step (left and right, move highlighted parts to new step) --- 2 + 2 buttons (with and without parts)
   - remove step (merge left or right) --- 2 buttons
   - dissolve sub model at current location --- 1 button
   - Move parts to previous/next step --- 2 buttons
   - Group parts into sub model --- 1 button
   - Color highlighted parts --- 1 button
 */
LDR.StepEditor = function(loader, stepHandler, onChange, modelID) {
    if(!modelID) {
        throw "Missing model ID!";
    }
    this.loader = loader;
    this.stepHandler = stepHandler;
    this.onChange = onChange;
    this.modelID = modelID;
    this.onStepSelectedListeners = [];

    // Current state variables:
    this.part;
    this.stepIndex;
    this.step;

    function showOrHide(options) {
        if(options.showEditor) {
            $("#editor").show();
        }
        else{
            $("#editor").hide();
        }
    }
    ldrOptions.listeners.push(showOrHide);
    
    // Private function to make it easier to create GUI components:
    this.makeEle = function(parent, type, cls, onclick, innerHTML, icon) {
        var ret = document.createElement(type);
        parent.appendChild(ret);

        if(cls) {
            ret.setAttribute('class', cls);
        }

        if(onclick) {
            ret.addEventListener('click', onclick);
        }

        if(icon) {
            ret.append(icon);
        }
        else if(innerHTML) {
            ret.innerHTML = innerHTML;
        }

        showOrHide(ldrOptions);
        return ret;
    }
}

LDR.StepEditor.prototype.updateCurrentStep = function() {
    var [part, stepIndex] = this.stepHandler.getCurrentPartAndStepIndex();
    this.part = part;
    this.stepIndex = stepIndex;
    this.step = part.steps[stepIndex];
    this.onStepSelectedListeners.forEach(listener => listener());
}

LDR.StepEditor.prototype.toggleEnabled = function() {
    ldrOptions.showEditor = 1-ldrOptions.showEditor;
    ldrOptions.onChange();
}

LDR.StepEditor.prototype.createGuiComponents = function(parentEle) {
    this.createRotationGuiComponents(parentEle);
    //this.createStepGuiComponents(parentEle); // TODO!
    this.createPartGuiComponents(parentEle);

    var self = this;
    
    var saveEle;
    function save() {
        var fileContent = self.loader.toLDR();
        saveEle.innerHTML = 'Saving...';
        $.ajax({
                url: 'ajax/save.htm',
                type: 'POST',
                data: {model: self.modelID, content: fileContent},
                dataType: "text",
                success: function(result) {
                    saveEle.innerHTML = 'SAVE';
                    console.dir(result);
                },
                error: function(xhr, status, error_message) {
                    saveEle.innerHTML = 'ERROR! PRESS TO SAVE AGAIN';
                    console.dir(xhr);
                    console.warn(status);
                    console.warn(error_message);
                }
            });
    }
    var saveParentEle = this.makeEle(parentEle, 'span', 'editor_control');
    saveEle = this.makeEle(saveParentEle, 'button', 'save_button', save, 'SAVE');
    this.updateCurrentStep();
}

LDR.StepEditor.prototype.createRotationGuiComponents = function(parentEle) {
    var self = this, Ele, Normal, Rel, Abs, End, X, Y, Z;
    function propagate(rot) {
        for(var i = self.stepIndex+1; i < self.part.steps.length; i++) {
            var s = self.part.steps[i];
            if(!THREE.LDRStepRotation.equals(self.step.rotation, s.rotation)) {
                console.log('Propagated ' + (i-self.stepIndex) + ' steps');
                break; // Only replace until not the same as the first.
            }
            s.rotation = rot ? rot.clone() : null;
        }
        self.step.rotation = rot; // Update starting step.
        self.onChange();
    }
    function makeNormal() { // Copy previous step rotation, or set to null if first step.
        propagate(self.stepIndex === 0 ? null : self.part.steps[self.stepIndex-1].rotation);
    }
    function makeRel() { 
        var rot = self.step.rotation ? self.step.rotation.clone() : new THREE.LDRStepRotation(0, 0, 0, 'REL');
        rot.type = 'REL';
        propagate(rot);
    }
    function makeAbs() {
        var rot = self.step.rotation ? self.step.rotation.clone() : new THREE.LDRStepRotation(0, 0, 0, 'ABS');
        rot.type = 'ABS';
        propagate(rot);
    }
    function makeEnd() {
        propagate(null);
    }

    function setXYZ(e) {
        e.stopPropagation();
        var rot = self.step.rotation ? self.step.rotation.clone() : new THREE.LDRStepRotation(0, 0, 0, 'REL');
        var x = parseFloat(X.value);
        var y = parseFloat(Y.value);
        var z = parseFloat(Z.value);
        if(isNaN(x) || isNaN(y) || isNaN(z) || 
           X.value !== ''+x || Y.value !== ''+y || Z.value !== ''+z) {
            return;
        }

        rot.x = x;
        rot.y = y;
        rot.z = z;
        propagate(rot);
    }

    Ele = this.makeEle(parentEle, 'span', 'editor_control');
    function makeRotationRadioButton(value, onClick, icon) {
        var button = self.makeEle(Ele, 'input', 'editor_radio_button', onClick);

        var label = self.makeEle(Ele, 'label', 'editor_radio_label', null, value, icon);
        label.setAttribute('for', value);

        button.setAttribute('type', 'radio');
        button.setAttribute('id', value);
        button.setAttribute('name', 'rot_type');
        return button;
    }
    Rel = makeRotationRadioButton('REL', makeRel, this.makeRelIcon());
    Abs = makeRotationRadioButton('ABS', makeAbs, this.makeAbsIcon());

    function makeXYZ(icon, sub, add, x1, y1, x2, y2) {
        function subOrAdd(fun) {
            var rot = self.step.rotation ? self.step.rotation.clone() : new THREE.LDRStepRotation(0, 0, 0, 'REL');
            fun(rot);
            propagate(rot);
            self.onChange();
        }
        var subEle = self.makeEle(Ele, 'button', 'editor_button', () => subOrAdd(sub), icon+'-', self.makeBoxArrowIcon(x1, y1, x2, y2));
        var ret = self.makeEle(Ele, 'input', 'editor_input', setXYZ);
        var addEle = self.makeEle(Ele, 'button', 'editor_button', () => subOrAdd(add), icon+'+', self.makeBoxArrowIcon(x2, y2, x1, y1));

        ret.addEventListener('keyup', setXYZ);
        ret.addEventListener('keydown', e => e.stopPropagation());
        return ret;
    }
    var rotDiff = 90;
    X = makeXYZ('X', rot => rot.x-=rotDiff, rot => rot.x+=rotDiff, -8, 11, -8, -5);
    Y = makeXYZ('Y', rot => rot.y-=rotDiff, rot => rot.y+=rotDiff, -10, 4, 10, 4);
    Z = makeXYZ('Z', rot => rot.z-=rotDiff, rot => rot.z+=rotDiff, 8, -5, 8, 11);

    function onStepSelected() {
        var rot = self.step.rotation;
        if(!rot) {
            rot = new THREE.LDRStepRotation(0, 0, 0, 'REL');
	    Rel.checked = true;
        }
        else { // There is currently a rotation:
            if(rot.type === 'REL') {
                Rel.checked = true;
            }
            else { // rot.type === 'ABS' as 'ADD' is unsupported.
                Abs.checked = true;
            }
        }

        X.value = rot.x;
        Y.value = rot.y;
        Z.value = rot.z;
    }
    this.onStepSelectedListeners.push(onStepSelected);
}

LDR.StepEditor.prototype.createPartGuiComponents = function(parentEle) {
    var self = this;
    var Ele = this.makeEle(parentEle, 'span', 'editor_control');
    var Remove = this.makeEle(Ele, 'button', 'editor_button', () => {self.stepHandler.removeGhosted(); self.onChange();}, 'REMOVE');//, self.makeBoxArrowIcon(x1, y1, x2, y2));

    function onlyShowButtonsIfPartsAreHighlighted() {
        var anyHighlighted = self.step.subModels.some(pd => pd.ghost);
        var display = anyHighlighted ? 'inline' : 'none';
        Remove.style.display = display;
        //Color.style.display = display;
    }
    this.onStepSelectedListeners.push(onlyShowButtonsIfPartsAreHighlighted);
}

/**
   SVG Icons for buttons:
*/
LDR.StepEditor.prototype.makeStepIcon = function() {
    var svg = document.createElementNS(LDR.SVG.NS, 'svg');
    svg.setAttribute('viewBox', '-75 -25 150 50');
    LDR.SVG.makeBlock3D(-50, 0, svg);
    LDR.SVG.makeArrow(-20, 0, 20, 0, svg);
    LDR.SVG.makeBlock3D(50, 0, svg);
    return svg;
}
LDR.StepEditor.prototype.makeRelIcon = function() {
    var svg = document.createElementNS(LDR.SVG.NS, 'svg');
    svg.setAttribute('viewBox', '-75 -25 150 50');

    // Left box
    LDR.SVG.makeBlock3D(-50, 0, svg);
    
    // Arrow:
    LDR.SVG.appendRotationCircle(0, 0, 18, svg);

    // Right hand side:
    var g = document.createElementNS(LDR.SVG.NS, 'g');
    svg.appendChild(g);
    g.setAttribute('transform', 'rotate(90 0 0) translate(-50 -55)');
    var turned = LDR.SVG.makeBlock3D(50, 0, g);

    return svg;
}
LDR.StepEditor.prototype.makeAbsIcon = function() {
    var svg = document.createElementNS(LDR.SVG.NS, 'svg');
    svg.setAttribute('viewBox', '-75 -25 150 50');
    LDR.SVG.makeBlock3D(-50, 0, svg);
    LDR.SVG.appendRotationCircle(0, 0, 18, svg);
    svg.append(LDR.SVG.makeRect(37, -13, 24, 31, true));
    return svg;
}
LDR.StepEditor.prototype.makeEndIcon = function() {
    var svg = document.createElementNS(LDR.SVG.NS, 'svg');
    svg.setAttribute('viewBox', '-75 -25 150 50');

    LDR.SVG.makeBlock3D(50, 0, svg);
    LDR.SVG.appendRotationCircle(0, 0, 18, svg);

    var g = document.createElementNS(LDR.SVG.NS, 'g');
    svg.appendChild(g);
    g.setAttribute('transform', 'rotate(90 0 0) translate(50 55)');
    var turned = LDR.SVG.makeBlock3D(-50, 0, g);

    return svg;
}
LDR.StepEditor.prototype.makeBoxArrowIcon = function(x1, y1, x2, y2) {
    var svg = document.createElementNS(LDR.SVG.NS, 'svg');
    svg.setAttribute('viewBox', '-20 -20 40 40');
    LDR.SVG.makeBlock3D(0, 0, svg);
    LDR.SVG.makeArrow(x1, y1, x2, y2, svg);
    return svg;
}
