window.$ = require('jquery')

const THREE = window.THREE = require('three')
const LDR = window.LDR = {}

require('three/addons/loaders/LDrawLoader.js')
THREE.OrbitControls = require('three/addons/controls/OrbitControls.js').OrbitControls

require('../lib/three/Pass.js')
require('../lib/three/CopyShader.js')
require('../lib/three/EffectComposer.js')
require('../lib/three/RenderPass.js')
require('../lib/three/ShaderPass.js')
require('../lib/three/FXAAShader.js')
require('../lib/three/OutlinePass.js')


require('../lib/ldr/colors.js')
require('../lib/ldr/LDRShaders.js')
require('../lib/ldr/LDRColorMaterials.js')
require('../lib/ldr/pli.js')
require('../lib/ldr/LDRSVG.js')
require('../lib/ldr/LDROptions.js')
require('../lib/ldr/ClientStorage.js')
require('../lib/ldr/LDRGeometries.js')
require('../lib/ldr/LDRStepHandler.js')
require('../lib/ldr/RectanglePacking.js')
require('../lib/ldr/LDRPLIBuilder.js')
require('../lib/ldr/LDRPLIPreview.js')
require('../lib/ldr/LDRButtons.js')
require('../lib/ldr/LDRMeasurer.js')
require('../lib/ldr/LDRColorPicker.js')
require('../lib/ldr/LDRLoader.js')
require('../lib/ldr/LDRStepEditor.js')
require('../lib/ldr/LDRGenerator.js')
require('../lib/ldr/LDRStuds.js')
require('../lib/ldr/LDRAssemblies.js')

require('../lib/ldr/LDCadGenerator.js')
require('../lib/ldr/LDRInstructionsManager.js')

require('../css/instructions.css')
require('../css/preview.css')
require('../css/options.css')
require('../css/buttons.css')

const template = require('./template.html')
const models = require('../model-list.json')

console.warn(models)

document.getElementById('model-list')


let manager;

export function loadInstructions(element, model, step = 1) {
    let options = {
        canEdit: false, // Show editor options
        buildAssemblies: true, // Assemble parts, such as minifig torsos and legs
        key: model,
        adPeek: 0, // Show a bar below to contain editor options - set to roughly 120 if canEdit is set to true
        setUpOptions: true, // Show button options below.
        showNumberOfSteps: true,
        pliMaxWidthPercentage: 30, // The maximum width of the PLI box in percentage of the screen width when the PLI box is shown on the left side.
        pliMaxHeightPercentage: 30, // The maximum height of the PLI box in percentage of the screen height when the PLI box is shown on top.
        timestamp: '1970-01-01 00:00:00', // Ensure that model can be retrieved from InstancedDB
        cleanUpPrimitivesAndSubParts: true
    };

    element.innerHTML = template.default

    let baseURL = `?model=${model}&step=`; // Change this line so it fits the page that renders instructions for you (probably not 'sample_instructions.htm')

    return manager = new LDR.InstructionsManager('models/' + model, '#', 14, null, ()=>{}, baseURL, step, options);
};



// Get the requested step from the query parameters:
const urlParams = new URLSearchParams(window.location.search);

const modelListContainer = document.getElementById('model-list')

models.forEach((m)=>{
    const link = document.createElement('a')
    link.innerText = m
    link.href="/?model=" + m
    link.addEventListener('click', ()=>{
        loadInstructions(
            document.getElementById('build-instruction-container'),
            m
        );
    })
    modelListContainer.append(link)
})

if(urlParams.get('model')){
    loadInstructions(
        document.getElementById('build-instruction-container'),
        urlParams.get('model'),
        urlParams.get('step'));
}
