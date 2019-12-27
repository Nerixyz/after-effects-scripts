/// <reference types="types-for-adobe/afterEffects/2018"/>

const exported: Utilities = {
  showPanel(panel: Panel | Window) {
    if (!(panel instanceof Panel)) {
      panel.show();
    }
  }
};

/**
 * Workaround for imports. Evaluating returns this object
 */
exported;
