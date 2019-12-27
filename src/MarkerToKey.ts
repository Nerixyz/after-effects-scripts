/// <reference types="types-for-adobe/afterEffects/2018"/>

//import utilities.ts
const {showPanel} = importFile<Utilities>('utilities');

showPanel(main(this));

interface WindowState {
  easingMode: DropDownList;
  controllerMode: DropDownList;
}
let windowState: WindowState;

function main(thisObj: Panel | any): Panel | Window {
  const title = 'Marker2Key';
  const window: Panel | Window =
    thisObj instanceof Panel ? thisObj : new Window('palette', title, undefined, { resizeable: true });
  window.spacing = 0;
  window.margins = 4;

  const controller = window.add('group');
  controller.spacing = 4;
  controller.orientation = 'row';
  const createControllerBtn = controller.add('button', undefined, 'Create Controller');
  createControllerBtn.onClick = () => createController();
  const buttonGroup = window.add('group');
  buttonGroup.spacing = 4;
  buttonGroup.margins = 4;
  buttonGroup.orientation = 'column';

  const runBtn = buttonGroup.add('button', undefined, 'Run');
  runBtn.onClick = () => markerToKey();
  const settingsGroup = window.add('group');
  settingsGroup.spacing = 10;
  settingsGroup.orientation = 'row';

  const easingMode = settingsGroup.add('dropdownlist', undefined, ['Normal / No', 'Ease']);
  easingMode.selection = 0;

  const controllerMode = settingsGroup.add('dropdownlist', undefined, ['Sapphire', 'Transform', 'No']);
  controllerMode.selection = 0;

  window.layout.layout();

  windowState = {
    easingMode,
    controllerMode,
  };

  return window;
}

function createController(): void {
  try {
    createBaseController();

    if (windowState.controllerMode.selection == 0) {
      createSapphireController();
    } else if (windowState.controllerMode.selection == 1) {
      createTransformController();
    }
  } catch (e) {
    alert(`Error:\n${e.message}\n@line ${e.line}\nstart ${e.start}\nend: ${e.end}`);
  }
}

function createBaseController(): void {
  const theComp = app.project.activeItem;

  if (!theComp || !(theComp instanceof CompItem)) {
    alert('Cannot find valid composition or the composition is empty!');
    return;
  }
  const nullLayer = theComp.layers.addNull();
  //const nullIndex = nullLayer.index;

  nullLayer.name = 'Controller';

  const sliderControl = nullLayer.effect.addProperty('ADBE Slider Control');
  // const realSlider = sliderControl.property("ADBE Slider Control-0001");

  sliderControl.name = 'Controller';
}

function createSapphireController(): void {
  const theComp = getCompOrThrow();

  const shakeLayer = theComp.layers.addSolid([1, 1, 1], 'Shake', theComp.width, theComp.height, 1);
  shakeLayer.adjustmentLayer = true;

  const shakeEffect = shakeLayer.effect.addProperty('S_Shake');

  const s_amp = 'S_Shake-0050';
  const s_zDist = 'S_Shake-0053';
  const s_tRAmp = 'S_Shake-0074';
  const s_tWAmp = 'S_Shake-0076';

  const amp = shakeEffect.property(s_amp) as Property;
  const zDist = shakeEffect.property(s_zDist) as Property;
  const tRAmp = shakeEffect.property(s_tRAmp) as Property;
  const tWAmp = shakeEffect.property(s_tWAmp) as Property;

  amp.setValue(0);
  amp.expression = 'value + thisComp.layer("Controller").effect("Controller")("Slider")';
  amp.expressionEnabled = true;

  zDist.expression = 'value - (0.25 * thisComp.layer("Controller").effect("Controller")("Slider"))';
  zDist.expressionEnabled = true;

  tRAmp.setValue(10);
  tWAmp.setValue(5);
}

function createTransformController(): void {
  const theComp = getCompOrThrow(true);

  const shakeLayer = theComp.layers.addSolid([1, 1, 1], 'Shake', theComp.width, theComp.height, 1);
  shakeLayer.adjustmentLayer = true;

  const shakeEffect = shakeLayer.effect.addProperty('ADBE Geometry2');

  const t_pos = 'ADBE Geometry2-0002';
  const t_scale = 'ADBE Geometry2-0003';
  const t_rot = 'ADBE Geometry2-0007';

  const pos = shakeEffect.property(t_pos) as Property;
  const scale = shakeEffect.property(t_scale) as Property;
  const rotation = shakeEffect.property(t_rot) as Property;

  pos.expression =
    'var amplitude = thisComp.layer("Controller").effect("Controller")("Slider");\nvar xAmp = 190.0 * amplitude;\nvar yAmp = 96.0 * amplitude;\nvar FREQUENCY = 8.0;\nvar OCTAWAVES = 1.0;\nvar outX = wiggle(FREQUENCY, xAmp, OCTAWAVES)[0];\nvar outY = wiggle(FREQUENCY, yAmp, OCTAWAVES)[1];\n[outX, outY];';
  pos.expressionEnabled = true;

  scale.expression = 'value + thisComp.layer("Controller").effect("Controller")("Slider")*50';
  scale.expressionEnabled = true;

  rotation.expression =
    'var amplitude = thisComp.layer("Controller").effect("Controller")("Slider");\nvar rotAmp = 10.0 * amplitude;\nvar FREQUENCY = 8.0;\nvar OCTAWAVES = 1.0;\nvar out = wiggle(FREQUENCY, rotAmp, OCTAWAVES);\n[out];';
  rotation.expressionEnabled = true;
}

function markerToKey(): void {
  const theComp = getCompOrThrow(true);

  const property = getPropertyOrThrow(
    getPropertyBaseOrThrow(
      getAVLayerOrThrow(theComp, 'Controller', { nullLayer: true }).effect,
      'ADBE Slider Control',
      { name: 'Controller' },
    ),
    'ADBE Slider Control-0001',
  );

  const markerProperty = getMarkerProperty(theComp);
  removeKeys(property);

  addMarkers(markerProperty, theComp, property);

  property.setValueAtTime(theComp.workAreaDuration - theComp.frameDuration, 0);
}

function getMarkerProperty(theComp: CompItem): Property {
  const compHasMarkers = theComp.markerProperty.numKeys > 0;

  let bestLayer: Layer = undefined;
  let hasLayer = false;
  let layerIndex = -1;

  for (let i = 1; i <= theComp.numLayers; i++) {
    if (theComp.layer(i).marker.numKeys > 0) {
      if (hasLayer) {
        hasLayer = false;
        break;
      } else {
        hasLayer = true;
        layerIndex = i;
      }
    }
  }
  if (hasLayer) {
    bestLayer = theComp.layer(layerIndex);
  }
  let markerProperty;

  if (compHasMarkers && confirm('Use CompositionMarkers', true, 'Please confirm')) {
    markerProperty = theComp.markerProperty;
  } else {
    if (bestLayer != undefined) {
      markerProperty = bestLayer.marker;
    } else {
      markerProperty = theComp.layer(parseInt(prompt('LayerIndex', '1', 'There were 0 or more than 1 layer(s)')))
        .marker;
    }
  }
  return markerProperty;
}

function removeKeys(property: Property): void {
  const totalKeys = property.numKeys;
  if (totalKeys > 0) {
    for (let i = totalKeys; i > 0; i--) {
      property.removeKey(i);
    }
  }
}

function addMarkers(markerProperty: Property, theComp: CompItem, property: Property): void {
  if (windowState.easingMode.selection == 0) {
    const totalMarkers = markerProperty.numKeys;

    for (let i = 1; i <= totalMarkers * 2; i++) {
      if (i % 2 == 0) property.setValueAtTime(markerProperty.keyTime(i / 2), 1);
      else property.setValueAtTime(markerProperty.keyTime((i + 1) / 2) - theComp.frameDuration, 0);
    }
  } else {
    const totalMarkers = markerProperty.numKeys;
    property.setValueAtTime(0, 0);
    for (let i = 1; i <= totalMarkers; i++) {
      property.setValueAtTime(markerProperty.keyTime(i), 1);

      const hasNextMarker = i != totalMarkers;
      const hasLastMarker = i != 0;

      let easeIn;
      let easeOut;

      const maxSpeed = 100;
      const minSpeed = 10;

      if (!hasLastMarker && !hasNextMarker) {
        easeIn = new KeyframeEase(10, 33);
        easeOut = new KeyframeEase(-10, 33);
      } else if (!hasLastMarker) {
        easeIn = new KeyframeEase(10, 33);
        const distOut = markerProperty.keyTime(i + 1) - markerProperty.keyTime(i);
        const speedOut = -(1 - clamp(distOut, 1, theComp.frameDuration * 2)) * (maxSpeed - minSpeed) + minSpeed;
        easeOut = new KeyframeEase(speedOut, 33);
      } else if (!hasNextMarker) {
        easeOut = new KeyframeEase(-10, 33);
        const distIn = markerProperty.keyTime(i) - markerProperty.keyTime(i - 1);
        const speedIn = (1 - clamp(distIn, 1, theComp.frameDuration * 2)) * (maxSpeed - minSpeed) + minSpeed;
        easeIn = new KeyframeEase(speedIn, 33);
      } else {
        const distIn = markerProperty.keyTime(i) - markerProperty.keyTime(i - 1);
        const distOut = markerProperty.keyTime(i + 1) - markerProperty.keyTime(i);

        const speedIn = (1 - clamp(distIn, 1, theComp.frameDuration * 2)) * (maxSpeed - minSpeed) + minSpeed;
        const speedOut = -(1 - clamp(distOut, 1, theComp.frameDuration * 2)) * (maxSpeed - minSpeed) + minSpeed;

        easeIn = new KeyframeEase(speedIn, 33);
        easeOut = new KeyframeEase(speedOut, 33);
      }

      property.setTemporalEaseAtKey(i + 1, [easeIn], [easeOut]);
    }
  }
}

function clamp(value, min, max): number {
  return Math.min(Math.max(value, min), max);
}

function getCompOrThrow(notEmpty: boolean = false): CompItem {
  const active = app.project?.activeItem;
  if (!active) {
    throw new Error('Could not find activeItem.');
  } else if (!(active instanceof CompItem)) {
    throw new Error('Composition not selected.');
  } else if (notEmpty && active.layers.length <= 0) {
    throw new Error('Composition is empty.');
  }
  return active;
}

function getAVLayerOrThrow(comp: CompItem, layerName: string, config: Partial<AVLayer> = {}): AVLayer {
  const layer = comp.layer(layerName);
  if (!layer) {
    throw new Error(`Could not get layer "${layerName}".`);
  } else if (!(layer instanceof AVLayer)) {
    throw new Error(`"${layerName}" is not an AVLayer.`);
  }
  for (const name in config) {
    if (layer[name] !== config[name]) {
      throw new Error(`"${layerName}".${name} is not ${config[name]?.toString() || '?'}.`);
    }
  }
  return layer;
}

function getPropertyBaseOrThrow(
  group: PropertyBase,
  propertyName: string,
  config: Partial<PropertyBase> = {},
): PropertyBase {
  const property = group.property(propertyName);
  if (!property) {
    throw new Error(`Could not get "${propertyName}" from ${group.name}.`);
  }
  for (const name in config) {
    if (property[name] !== config[name]) {
      throw new Error(`${property.name}.${name} is not ${config[name]?.toString() || '?'}`);
    }
  }
  return property;
}

function getPropertyOrThrow(group: PropertyBase, propertyName: string, config: Partial<Property> = {}): Property {
  const potential = getPropertyBaseOrThrow(group, propertyName, config);
  if (!(potential instanceof Property)) {
    throw new Error(`"${propertyName}" is not a Property`);
  }
  return potential;
}

function importFile<T>(path: string): T {
  return $.evalFile(new File(`./${path}.js`));
}
