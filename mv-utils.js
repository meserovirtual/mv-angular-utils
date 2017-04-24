/*TODO: No funciona para carritos*/
(function () {
    'use strict';
    var scripts = document.getElementsByTagName("script");
    var currentScriptPath = scripts[scripts.length - 1].src;
    angular.module('mvUtils', ['ngRoute'])
        .config(['$routeProvider', function ($routeProvider) {
            $routeProvider.when('/module', {
                templateUrl: currentScriptPath.replace('.js', '.html'),
                controller: 'MvUtils'
            });
        }])
        .controller('MvUtilsController', MvUtilsController)
        .factory('MvUtils', MvUtils)
        .service('MvUtilsGlobals', MvUtilsGlobals)
        .directive('mvSearchPanel', MvSearchPanel)
        .directive('mvValidator', MvValidator)
        .factory('ErrorHandler', ErrorHandler)
        .factory('xlatService', xlatService)
        .filter('xlat', xlat)
        .component('mvWaiting', MvWaiting())
        .component('mvBlocker', MvBlocker());


    function MvBlocker(){
        return {
            bindings: {
                blockerClick: '&',
                visibility: '<'
            },
            template: '<div id="blocker" ' +
            'style="height: 100%; width: 100%; background-color: rgba(10,10,10,0.6); position: fixed; top:0; left: 0" ' +
            'ng-if="$ctrl.visibility"' +
            'ng-click="$ctrl.blockerClick()"></div>',
            controller: function(){
                var vm = this;
            }
        }
    }


    function MvWaiting() {
        return {
            bindings: {
                texto: '=',
                imagen: '='
            },
            template: '' +
            '<div ' +
            'id="mv-waiting" ' +
            'ng-if="$ctrl.isWaiting">' +
            '<span>{{$ctrl.texto}}</span>' +
            '<div ng-class="$ctrl.imagen"></div>' +
            '</div>',
            controller: MvWaitingController
        }
    }

    MvWaitingController.$inject = ['$rootScope'];
    function MvWaitingController($rootScope) {
        var vm = this;
        vm.isWaiting = false;

        $rootScope.$on("startWaiting", function () {
            vm.isWaiting = true;
        });

        $rootScope.$on("stopWaiting", function () {
            vm.isWaiting = false;
        });
    }

    xlatService.$inject = ['initialXlatTables', '$interpolate'];
    function xlatService(initialXlatTables, $interpolate) {
        var currentLanguage = 'es';
        var tables = angular.copy(initialXlatTables);
        return {
            setCurrentLanguage: function (newCurrentLanguage) {
                currentLanguage = newCurrentLanguage;
            },
            getCurrentLanguage: function () {
                return currentLanguage;
            },
            xlat: function (label, parameters) {
                if (parameters == null || parameters == undefined) {
                    return tables[currentLanguage][label];
                } else {
                    return $interpolate(
                        tables[currentLanguage][label])(
                        parameters);
                }
            }
        };
    }

    xlat.$inject = ['xlatService'];
    function xlat(xlatService) {
        return function (label, parameters) {
            return xlatService.xlat(label, parameters);
        };
    }

    MvValidator.$inject = ["MvUtils", 'MvUtilsGlobals', '$timeout'];
    function MvValidator(MvUtils, MvUtilsGlobals, $timeout) {
        return {
            restrict: 'A',
            scope: {
                isRequired: '@', // Mensaje de error para el requerido, la presencia del mensaje significa que es requerido
                minLength: '@', // Minima longitud de la cadena, separado por ; el mensaje para el error. Ej: min-length="5;El texto ingresado es demasiado corto"
                maxLength: '@', // Máxima longitud de la cadena, separado por ; el mensaje para el error. Ej: min-length="5;El texto ingresado es demasiado largo"
                isMail: '@', // Mensaje de error por si el formato del mail es incorrecto, la presencia del mensaje significa que es mail
                isCuit: '@', // Mensaje de error por si el formato del CUIT es incorrecto, la presencia del mensaje significa que es CUIT
                minNumber: '@', // Número mínimo que puede ingresar, ej: min-number="5;El número debe ser mayor a 5"
                maxNumber: '@', // Número máximo que puede ingresar, ej: min-number="5;El número debe ser menor a 5"
                minDate: '@', // Compara la fecha. ej: min-date="today;La fecha no puede ser menor a hoy" / También se pueden enviar fechas variables {{'11/25/2015'}}
                maxDate: '@', // Compara la fecha
                ngModel: '=' // Compara la fecha
            },
            controller: function ($scope, $element, $attrs) {
                var vm = this;

                // Agrego siempre el error, luego se va cuando completo bien los datos requeridos
                addError(getMainContainer($element));

                /**
                 * En el caso que se necesite, borra todas las instancias de los mensajes de error. No usar en la mayoría de los casos.
                 */
                MvUtilsGlobals.listen(function () {
                    var control = angular.element(document.querySelectorAll('.error-input'));
                    var error = angular.element(document.querySelectorAll('.error-message'));

                    for (var i = 0; i < control.length; i++) {
                        control[i].classList.remove('error-input');
                        control[i].removeEventListener('focus');
                        //mensaje.remove();
                    }
                    for (var i = 0; i < error.length; i++) {
                        error[i].remove();
                    }
                });

                /**
                 * @description Busca el padre del formulario, esta clave obtenida luego se usa para ver si tiene errores encolados
                 * @param el
                 */
                function getMainContainer(el) {
                    while (el.parent()) {
                        el = el.parent();
                        for (var i = 0; i < el[0].attributes.length; i++) {
                            if (el[0].attributes[i].nodeName == 'form-id') {
                                return (el[0].attributes[i].nodeValue);
                            }
                        }
                    }
                    return null;
                }

                /**
                 * @description Agrega un error al formulario para evitar que se ejecute cualquier acción
                 * @param parent
                 */
                function addError(parent) {

                    if ($element[0].id.trim().length == 0 ||
                        ($element[0].tagName == 'BUTTON' || $element[0].type == 'button')) {
                        return;
                    }

                    var elem = $element;

                    // Randomizo un id para el div que voy a crear con la descripción del error
                    var id = Math.floor((Math.random() * 1000) + 1);

                    // Texto en donde mostrar el error, separo cada texto con </br>
                    var texto = '';

                    // Verifico requerido
                    if ($scope.isRequired != undefined && $element.val().trim().length == 0) {
                        texto = texto + $scope.isRequired + '</br>';
                    }

                    // Verifico longitud mínima
                    if ($scope.minLength != undefined && $element.val().length < $scope.minLength.split(';')[0]) {
                        texto = texto + $scope.minLength.split(';')[1] + '</br>';
                    }

                    // Verifico longitud máxima
                    if ($scope.maxLength != undefined && $element.val().length > $scope.maxLength.split(';')[0]) {
                        texto = texto + $scope.maxLength.split(';')[1] + '</br>';
                    }

                    // Verifico si el mail es correcto
                    if ($scope.isMail != undefined && !MvUtils.validateEmail($element.val())) {
                        texto = texto + $scope.isMail + '</br>';
                    }

                    // Verifico si el CUIT/CUIL es correcto
                    if ($scope.isCuit != undefined && $element.val().length != 8 && !MvUtils.validaCuit($element.val())) {
                        texto = texto + $scope.isCuit + '</br>';
                    }

                    // Verifico floor
                    if ($scope.minNumber != undefined && (parseFloat($element.val()) < parseFloat($scope.minNumber.split(';')[0]) || isNaN(parseFloat($element.val())))) {
                        texto = texto + $scope.minNumber.split(';')[1] + '</br>';
                    }

                    // Verifico ceiling
                    if ($scope.maxNumber != undefined && (parseFloat($element.val()) > parseFloat($scope.maxNumber.split(';')[0]) || isNaN(parseFloat($element.val())))) {
                        texto = texto + $scope.maxNumber.split(';')[1] + '</br>';
                    }

                    // Verifico fecha mínima
                    if ($scope.minDate != undefined) {
                        if ($scope.minDate.split(';')[0] == 'today') {
                            if (new Date($element.val()) < new Date()) {
                                texto = texto + $scope.minDate.split(';')[1] + '</br>';
                            }
                        } else {
                            if ((new Date($element.val()) < new Date($scope.minDate.split(';')[0]))) {
                                texto = texto + $scope.minDate.split(';')[1] + '</br>';
                            }
                        }
                    }

                    // Verifico fecha máxima
                    if ($scope.maxDate != undefined) {
                        if ($scope.maxDate.split(';')[0] == 'today') {
                            if (new Date($element.val()) > new Date()) {
                                texto = texto + $scope.maxDate.split(';')[1] + '</br>';
                            }
                        } else {
                            if ((new Date($element.val()) > new Date($scope.minDate.split(';')[0]))) {
                                texto = texto + $scope.maxDate.split(';')[1] + '</br>';
                            }
                        }
                    }

                    texto = texto.substr(0, texto.length - 5);

                    // Si no hay errores me voy de la función
                    if (texto == undefined || texto == 'undefined' || texto.trim().length == 0) {
                        // Remuevo el error si existe y salgo de la validación
                        removeError(getMainContainer(elem));
                        return false;
                    }


                    // Obtengo el nodo con propiedad que se llame como el padre
                    if (!MvUtilsGlobals.errores.hasOwnProperty(parent)) {
                        MvUtilsGlobals.errores[parent] = {};
                    }

                    // Obtengo el nodo relacionado al control que estoy mirando, si no existe, lo creo
                    if (!MvUtilsGlobals.errores[parent].hasOwnProperty($element[0].id)) {
                        MvUtilsGlobals.errores[parent][$element[0].id] = {};
                    }

                    // Sobreescribo el valor del texto que contiene la descr del error
                    MvUtilsGlobals.errores[parent][$element[0].id]['texto'] = texto;
                    return true;
                }

                /**
                 * @description Remueve el estado de error para el formulario
                 * @param parent
                 */
                function removeError(parent) {

                    // Si no existe el padre, salgo ya que no tiene errores
                    if (!MvUtilsGlobals.errores.hasOwnProperty(parent)) {
                        return;
                    }

                    // verifico si algún hijo tiene errores
                    if (MvUtilsGlobals.errores[parent].hasOwnProperty($element[0].id)) {
                        delete MvUtilsGlobals.errores[parent][$element[0].id];

                        if (Object.keys(MvUtilsGlobals.errores[parent]).length === 0) {
                            delete MvUtilsGlobals.errores[parent];
                        }


                        var mensaje = angular.element(document.querySelector('#error-' + $element[0].id));
                        mensaje.remove();
                        $element.removeClass('error-input');
                    }

                }

                /**
                 * Dentro de esta función valido el evento click y si no está todo ok en el formulario, no lo ejecuto
                 */
                if ($element[0].tagName == 'BUTTON' || $element[0].type == 'button') {
                    $element.bind('click', function (e) {
                        var parent = getMainContainer($element);
                        // Si no existe el padre, salgo ya que no tiene errores
                        if (!MvUtilsGlobals.errores.hasOwnProperty(parent)) {
                            return;
                        }

                        var lstErrores = Object.getOwnPropertyNames(MvUtilsGlobals.errores[parent]);

                        lstErrores.forEach(function (e, index, array) {
                            (function () {
                                var elem = angular.element(document.querySelector('#' + e));
                                elem.addClass('error-input');
                                if(elem[0] != undefined) {
                                    elem[0].addEventListener('focus', function () {
                                        elem.removeClass('error-input');
                                        elem[0].removeEventListener('focus', removeFocus);
                                        removeError(getMainContainer(elem));
                                    });
                                }
                            })();
                            addMessages(angular.element(document.querySelector('#' + e)));
                        });

                        e.stopImmediatePropagation();
                        e.preventDefault();
                        e.stopPropagation();
                    });

                }

                /**
                 * Cuando el usuario abandona el control, se ejecuta la validación
                 */
                $element.bind('blur', onChange);
                $element.bind('keyup', onChange);
                $scope.$watch('ngModel', function (newVal, oldVal) {
                    onChange(newVal, oldVal, 'ngModel');
                });

                /**
                 * Function validadora
                 * @param v nuevo valor
                 * @param value origen de la llamada de la función
                 */
                function onChange(v, o, value) {

                    // Fallback para cuando se inicializa el control
                    // v es undefined en el onload
                    if (value == 'ngModel' && (v == undefined || v.length == 0)) {
                        return;
                    }
                    v = (v == undefined) ? '' : v;

                    o = (o == undefined) ? '' : o;

                    if (Math.abs(v.length - o.length) == 1) {
                        return;
                    }

                    // No hago nada en el blur del botón
                    if ($element[0].tagName == 'BUTTON' || $element[0].type == 'button') {
                        return;
                    }

                    var elem = $element;
                    if(!addError(getMainContainer(elem))){
                        return;
                    }
                    addMessages(elem);
                }


                /**
                 * @description Agrega visualización del error y el callback para limpiarla
                 * @param elem
                 * @param texto
                 */
                function addMessages(elem) {
                    var parent = getMainContainer(elem);

                    //Agrego la visualización del error
                    elem.addClass('error-input');


                    if (angular.element(document.querySelector('#error-' + elem[0].id)).length == 0 &&
                        MvUtilsGlobals.errores.hasOwnProperty(parent) &&
                        MvUtilsGlobals.errores[parent].hasOwnProperty(elem[0].id)) {
                        elem.after('<div class="error-message" id="error-' + elem[0].id + '">' + MvUtilsGlobals.errores[parent][elem[0].id]["texto"] + '</div>');
                    }
                    var mensaje = angular.element(document.querySelector('#error-' + elem[0].id));

                    mensaje.css('top', (elem[0].offsetTop + elem[0].offsetHeight) + 'px');
                    mensaje.css('left', elem[0].offsetLeft + 'px');

                    clear();

                    function clear() {
                        elem[0].addEventListener('focus', function () {
                            elem.removeClass('error-input');
                            elem[0].removeEventListener('focus', removeFocus);
                            mensaje.remove();
                            removeError(getMainContainer(elem));
                        });
                    }
                }

                /**
                 * Función que se ejecuta al remover el evento focus
                 * @param elem
                 * @param mensaje
                 */
                function removeFocus() {
                }


                /**
                 * Validación de CUIT/CUIL
                 * @param sCUIT
                 * @returns {boolean}
                 */
                /*
                function validaCuit(sCUIT) {
                    var aMult = '6789456789';
                    var aMult = aMult.split('');
                    var sCUIT = String(sCUIT);
                    var iResult = 0;
                    var aCUIT = sCUIT.split('');

                    if (aCUIT.length == 11) {
                        // La suma de los productos
                        for (var i = 0; i <= 9; i++) {
                            iResult += aCUIT[i] * aMult[i];
                        }
                        // El módulo de 11
                        iResult = (iResult % 11);

                        // Se compara el resultado con el dígito verificador
                        return (iResult == aCUIT[10]);
                    }
                    return false;
                }
                */

            },
            link: function (scope, element, attrs, ctrl) {

            },
            controllerAs: 'mvSearchCtrl'
        };
    }

    /**
     * Directiva que muestra un panel de resultados de las b?squedas. Para darle aspecto, utilizar .mv-result-panel
     * @type {string[]}
     */
    MvSearchPanel.$inject = ['$injector', 'MvUtilsGlobals', '$timeout', '$compile'];
    function MvSearchPanel($injector, MvUtilsGlobals, $timeout, $compile) {
        return {
            restrict: 'AE',
            scope: {
                service: '=', // El servicio que va a devolver los valores
                params: '@', // Campos en donde buscar, string separado por comas, sin espacios, y el nombre del campo de la tabla
                exactMatch: '=', // True busca la palabra completa, False solo un parcial -> recomendado
                visible: '@', // lo que se va a mostrar en el listado, string separado por comas, sin espacios, y el nombre del campo de la tabla
                selected: '=', // El objeto en donde queremos volcar la selecci?n
                objeto: '=', // El objeto en donde queremos volcar la selecci?n,
                func: '@', // Si se desea se pude pasar otra funciï¿½n
                minInput: '=' // Si se desea se pude pasar otra funciï¿½n
            },
            controller: function ($scope, $element, $attrs) {
                var vm = this;

                vm.resultados = [];
                vm.mvItemListPanelSelected = 0;
                var timeout = {};
                vm.minInput = ($scope.minInput) ? $scope.minInput : 2;

                vm.over = false;

                // Cuando saco el mouse de la ventana, se tiene que ocultar la ventana
                $element.bind('mouseleave', function () {
                    vm.over = false;
                    timeout = $timeout(MvUtilsGlobals.broadcastPanel, 1000);
                });

                // El mouse arriba tiene que evitar que oculte la ventana
                $element.bind('mouseover', function () {
                    $timeout.cancel(timeout);
                    vm.over = true;
                });

                // Copio el objeto, si no lo copio y lo envio directo se borra del array original
                vm.selectItem = function (i) {
                    $scope.objeto = angular.copy(vm.resultados[i]);
                    vm.over = false;
                    MvUtilsGlobals.broadcastPanel();
                };

                // Mï¿½todo principal cuando tiene el foco o cuando presiona la tecla
                $element.bind('keyup focus', function (event) {
                    $timeout.cancel(timeout);

                    if ($element.val().length > vm.minInput) {

                        // Avisa a todos los paneles para que se oculten
                        vm.over = false;
                        MvUtilsGlobals.broadcastPanel();

                        // Consigo el servicio a partir del par?metro pasado en la directiva
                        var myService = $injector.get($attrs.service);

                        if ($scope.func != undefined) {
                            $injector.get($attrs.service)[$scope.func]($scope.params, $element.val(), function (data) {
                                if (data.length > 0) {
                                    procesarRespuesta(data);
                                }
                            });

                        } else {
                            // Invoco al evento genÃ©rico
                            myService.getByParams($attrs.params, $element.val(), $attrs.exactMatch, function (data) {
                                if (data.length > 0) {
                                    procesarRespuesta(data);
                                }
                            });
                        }


                    } else {
                        vm.over = false;
                        MvUtilsGlobals.broadcastPanel();
                    }
                });

                function procesarRespuesta(data) {

                    vm.resultados = data;
                    // Creo un random id para darle a la lista y que no tenga error con otros div de la aplicaci?n
                    var id = Math.floor((Math.random() * 100000) + 1);

                    // Creo el contenedor de los items que devuelvo de la b?squeda.
                    $element.after('<div class="mv-result-panel" id="panel-' + id + '"></div>');

                    // Obtengo a la lista y la guardo en una variable
                    var lista = angular.element(document.querySelector('#panel-' + id));


                    // Agrego un evento que cuando me voy de la lista espero un segundo y la remuevo
                    lista.bind('mouseleave', function () {
                        vm.over = false;
                        timeout = $timeout(MvUtilsGlobals.broadcastPanel, 1000);
                    });

                    // Agrego un evento que cuando estoy sobre la lista, no se oculte
                    lista.bind('mouseover focus', function () {
                        $timeout.cancel(timeout);
                        vm.over = true;
                    });

                    // Parseo la lista de columnas a mostrar en la lista
                    var a_mostrar_columnas = $attrs.visible.split(',');

                    // Reviso la lista completa para saber que mostrar
                    for (var i = 0; i < data.length; i++) {
                        var columns = Object.keys(data[i]);
                        var a_mostrar_text = '';

                        for (var x = 0; x < columns.length; x++) {
                            for (var y = 0; y < a_mostrar_columnas.length; y++) {
                                if (a_mostrar_columnas[y] == columns[x]) {
                                    var base = ' ' + data[i][Object.keys(data[i])[x]];
                                    a_mostrar_text = a_mostrar_text + base;
                                }
                            }
                        }
                        lista.append($compile('<div class="mv-item-list" ng-click="mvSearchCtrl.selectItem(' + i + ')" ng-class="{\'mv-item-selected-list\': mvSearchCtrl.mvItemListPanelSelected == ' + i + '}">' + a_mostrar_text + '</div>')($scope));
                    }


                    // Selecciono Item de la lista
                    // Me muevo para abajo en la lista
                    if (event.keyCode == 40) {
                        vm.mvItemListPanelSelected = (vm.mvItemListPanelSelected + 1 > data.length - 1) ? vm.mvItemListPanelSelected : vm.mvItemListPanelSelected + 1;
                    }

                    // Me muevo para arriba en la lista
                    if (event.keyCode == 38) {
                        vm.mvItemListPanelSelected = (vm.mvItemListPanelSelected - 1 < 0) ? vm.mvItemListPanelSelected : vm.mvItemListPanelSelected - 1;
                    }

                    // selecciono
                    if (event.keyCode == 13) {
                        vm.selectItem(vm.mvItemListPanelSelected);
                    }

                    // Agrego formatos bï¿½sicos para la lista
                    lista.css('position', 'absolute');
                    lista.css('top', ($element[0].offsetTop + $element[0].offsetHeight) + 'px');
                    lista.css('left', $element[0].offsetLeft + 'px');
                    lista.css('width', $element[0].offsetWidth + 'px');
                    lista.css('max-width', $element[0].offsetWidth + 'px');


                    // Me aseguro que no se oculte la lista
                    vm.over = true;
                }

                // Oculto la lista si no est? el mouse arriba y no tiene foco
                MvUtilsGlobals.listenPanel(function () {
                    if (vm.over) {
                        return;
                    }
                    var control = angular.element(document.querySelectorAll('.mv-result-panel'));
                    for (var i = 0; i < control.length; i++) {
                        control[i].remove();
                    }
                });

            },
            link: function (scope, element, attr) {


            },
            controllerAs: 'mvSearchCtrl'
        };
    }

    MvUtilsController.$inject = [];
    function MvUtilsController() {
    }

    /**
     * Expone variables de control de la clase
     * @type {string[]}
     */
    MvUtilsGlobals.$inject = ['$rootScope'];
    function MvUtilsGlobals($rootScope) {
        this.isWaiting = false;
        this.sucursal_auxiliar_id = -1;
        // Cantidad mínima de caracteres para que se ejecute getByParams
        this.getByParamsLenght = 2;
        this.errores = [];

        // Inicia la pantalla de espera
        this.startWaiting = function () {
            $rootScope.$broadcast("startWaiting");
        };

        // Finaliza la pantalla de espera
        this.stopWaiting = function () {
            $rootScope.$broadcast("stopWaiting")
        };


        this.broadcast = function () {
            $rootScope.$broadcast("MvUtilsGlobalsValidations")
        };
        this.listen = function (callback) {
            $rootScope.$on("MvUtilsGlobalsValidations", callback)
        };

        this.broadcastPanel = function () {
            $rootScope.$broadcast('acSearchPanels');
        };

        this.listenPanel = function (callback) {
            $rootScope.$on('acSearchPanels', callback);
        };
    }

    /**
     * Expone validaciones y otras herramientas de uso común
     * @type {string[]}
     */
    MvUtils.$inject = ['MvUtilsGlobals', '$document', '$timeout', '$q'];
    function MvUtils(MvUtilsGlobals, $document, $timeout, $q) {
        var service = {};

        service.validateEmail = validateEmail;
        service.validaCuit = validaCuit;
        service.validaTelefono = validaTelefono;
        service.validaNumero = validaNumero;
        service.validaFecha = validaFecha;
        service.validaHora = validaHora;
        service.validations = validations;
        service.verifyBrowser = verifyBrowser;
        service.getByParams = getByParams;
        service.showMessage = showMessage;
        service.omitirAcentos = omitirAcentos;
        // Servicios de paginación
        service.goToPagina = goToPagina;
        service.first = first;
        service.last = last;
        service.prev = prev;
        service.next = next;

        return service;

        /**
         *
         * @param texto
         * @returns {*}
         */
        function omitirAcentos(texto){
            var acentos = "ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç";
            var original = "AAAAAEEEEIIIIOOOOUUUUaaaaaeeeeiiiioooouuuunncc";

            if(texto !== undefined) {
                for(var i=0; i < acentos.length; i++){
                    texto = texto.replace(acentos.charAt(i), original.charAt(i));
                }
            }
            console.log(texto);
            return texto;
        }

        /**
         * @description Retorna la lista filtrada de Carritos
         * @param params -> String, separado por comas (,) que contiene la lista de par?metros de b?squeda, por ej: nombre, sku
         * @param values
         * @param exact_match
         * @param data
         * @param callback
         */
        function getByParams(params, values, exact_match, data) {
            var deferred = $q.defer();
            if (data.length == 0) {
                return;
            }

            var parametros = params.split(',');
            var valores = values.split(',');
            var exactos = exact_match.split(',');


            var respuesta = [];
            for (var y = 0; y < data.length; y++) {
                var columns = Object.keys(data[y]);

                for (var i = 0; i < columns.length; i++) {
                    for (var x = 0; x < parametros.length; x++) {
                        if (columns[i] == parametros[x]) {

                            var base = '' + data[y][Object.keys(data[y])[i]];
                            var valor = (valores.length == 1) ? '' + valores[0] : '' + valores[x];
                            var exacto = (exactos.length == 1) ? exactos[0] : exactos[x];
                            exacto = exacto == 'true';
                            var negado = valor.indexOf('!') > -1;

                            // Indices para remover del array respuesta
                            var index_a_sacar = [];


                            if (negado) {

                                if (
                                    ( exacto && removeDiacritics(base).toUpperCase() !== removeDiacritics(valor).toUpperCase().replace('!', '')) ||
                                    (!exacto && !compareStringSearch(base.replace('!', ''), valor))
                                ) {
                                    respuesta.push(data[y]);
                                    x = parametros.length;
                                    i = columns.length;

                                } else {

                                    index_a_sacar.push(y);

                                }
                            } else {
                                if (
                                    ( exacto && removeDiacritics(base).toUpperCase() == removeDiacritics(valor).toUpperCase()) ||
                                    (!exacto && compareStringSearch(base, valor))
                                ) {
                                    respuesta.push(data[y]);
                                    x = parametros.length;
                                    i = columns.length;
                                }
                            }

                        }
                    }
                }
            }

            deferred.resolve(respuesta);
            return deferred.promise;
        }

        /**
         * Función especializada en encontrar todas las coincidencias dentro de otra cadena, no importando el orden en
         * la que se encuentra escrita la consulta.
         * @param base
         * @param valor
         * @returns {boolean}
         */
        function compareStringSearch(base, valor) {

            var valores = valor.split(" ");
            var encontrados = 0;

            for (var x = 0; x < valores.length; x++) {
                var val = (valores.length > 1) ? valores[x] : valor;

                if (base.toUpperCase().indexOf(val.toUpperCase()) > -1) {
                    encontrados = encontrados + 1;
                }

            }


            return encontrados == valores.length;

        }

        function verifyBrowser() {

            var obj = {};
            obj.isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
            // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
            obj.isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
            obj.isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
            // At least Safari 3+: "[object HTMLElementConstructor]"
            obj.isChrome = !!window.chrome && !isOpera;              // Chrome 1+
            obj.isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6

            return obj;
        }

        /**
         *
         * @param email
         * @returns {boolean}
         */
        function validateEmail(email) {
            var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
            return re.test(email);
        }

        /**
         * http://stackoverflow.com/questions/15491894/regex-to-validate-date-format-dd-mm-yyyy
         * @param fecha
         */
        function validaFecha(fecha) {
            //var reg = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/;
            var reg = /^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/;
            return reg.test(fecha);
        }


        function validaNumero(numero) {
            var reg = /^[0-9]+$/;
            return reg.test(numero);
        }


        /**
         *
         * @param hora
         * @returns {boolean}
         */
        function validaHora(hora) {
            var reg = /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]:[0-5][0-9]$/;
            return reg.test(hora);

            //var reg = /^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$/;
            //return reg.test(hora);
        }

        /**
         *
         * @param telefono
         * @returns {boolean}
         */
        function validaTelefono(telefono) {
            var reg = /^[(]{0,1}[0-9]{3}[)]{0,1}[-\s\.]{0,1}[0-9]{3}[-\s\.]{0,1}[0-9]{4}$/;
            return reg.test(telefono);

            /*
            var reg = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
            if(telefono.value.match(reg)) {
                return true;
            } else {
                return false;
            }
            */
        }

        /**
         * Validación de CUIT/CUIL
         * @param sCUIT
         * @returns {boolean}
         */
        function validaCuit(sCUIT) {
            console.log(sCUIT);
            var aMult = '6789456789';
            var aMult = aMult.split('');
            var sCUIT = String(sCUIT);
            var iResult = 0;
            var aCUIT = sCUIT.split('');

            if (aCUIT.length == 11) {
                // La suma de los productos
                for (var i = 0; i <= 9; i++) {
                    iResult += aCUIT[i] * aMult[i];
                }
                // El módulo de 11
                iResult = (iResult % 11);

                // Se compara el resultado con el dígito verificador
                return (iResult == aCUIT[10]);
            }
            return false;
        }

        function validations(control, texto) {
            var id = Math.floor((Math.random() * 1000) + 1);
            var elem = angular.element(document.querySelector('#' + control));
            elem.addClass('error-input');
            elem.after('<div class="error-message" id="error-' + id + '">' + texto + '</div>');
            var mensaje = angular.element(document.querySelector('#error-' + id));


            mensaje.css('top', (elem[0].offsetTop + elem[0].offsetHeight) + 'px');
            mensaje.css('left', elem[0].offsetLeft + 'px');

            clear();

            function clear() {
                elem[0].addEventListener('focus', function () {
                    elem.removeClass('error-input');
                    elem[0].removeEventListener('focus');
                    mensaje.remove();
                });
            }

            MvUtilsGlobals.listen(function () {
                var control = angular.element(document.querySelectorAll('.error-input'));
                var error = angular.element(document.querySelectorAll('.error-message'));

                for (var i = 0; i < control.length; i++) {
                    control[i].classList.remove('error-input');
                    control[i].removeEventListener('focus');
                    mensaje.remove();
                }
                for (var i = 0; i < error.length; i++) {
                    error[i].remove();
                }
            });

        }

        function showMessage(tipo, texto, timeout) {
            var body = $document.find('body').eq(0);

            //var class_type = (tipo == 'error') ? 'mv-error-message' : 'mv-success-message';
            var class_type = '';
            var class_fa_type = '';
            var class_ico = '';
            if(tipo == 'success') {
                class_type = 'mv-success-message';
                class_fa_type = 'fa-check';
                class_ico = 'ico-success';
            } else if(tipo == 'error') {
                class_type = 'mv-error-message';
                class_fa_type = 'fa-ban';
                class_ico = 'ico-error';
            } else if(tipo == 'info') {
                class_type = 'mv-info-message';
                class_fa_type = 'fa-info-circle';
                class_ico = 'ico-info';
            } else if(tipo == 'warning') {
                class_type = 'mv-warning-message';
                class_fa_type = 'fa-warning';
                class_ico = 'ico-warn';
            }

            body.append('<div ' +
                'style="" ' +
                'class="mv-mensaje-custom-show ' + class_type + '" ' +
                'id="mv-mensaje-custom" onclick="this.remove();"><i class="fa ' + class_fa_type + ' ' + class_ico + ' fa-2x"></i>' + texto +
                '<i class="fa fa-times fa-2x exit-button ' + class_ico + '"' + ' onclick="this.remove();"></i></div>');

            timeout = (timeout == undefined) ? 3000 : timeout;
            $timeout(function () {
                var el = angular.element(document.querySelector('#mv-mensaje-custom'));
                el.remove();
            }, timeout);

        }


        /**
         * Para el uso de la p�ginaci�n, definir en el controlador las siguientes variables:
         *
         vm.start = 0;
         vm.pagina = UserVars.pagina;
         UserVars.paginacion = 5; Cantidad de registros por p�gina
         vm.end = UserVars.paginacion;


         En el HTML, en el ng-repeat agregar el siguiente filtro: limitTo:appCtrl.end:appCtrl.start;

         Agregar un bot�n de next:
         <button ng-click="appCtrl.next()">next</button>

         Agregar un bot�n de prev:
         <button ng-click="appCtrl.prev()">prev</button>

         Agregar un input para la p�gina:
         <input type="text" ng-keyup="appCtrl.goToPagina()" ng-model="appCtrl.pagina">

         */



        function first(_vars) {
            _vars.pagina = 1;
            return goToPagina(_vars.pagina, _vars);
        }

        function last(_vars) {
            _vars.pagina = _vars.paginas;
            return goToPagina(_vars.pagina, _vars);
        }


        /**
         * @description: Ir a p�gina
         * @param pagina
         * @returns {*}
         * uso: agregar un m�todo
         vm.goToPagina = function () {
                vm.start= UserService.goToPagina(vm.pagina).start;
            };
         */
        function goToPagina(pagina, _vars) {

            if (pagina == null || pagina == undefined) {
                return {};
            }

            if (isNaN(pagina) || pagina < 1) {
                _vars.pagina = 1;
                pagina = 1;
            }

            if (pagina > _vars.paginas) {
                pagina = _vars.paginas;
            }

            _vars.pagina = pagina;
            _vars.start = (_vars.pagina - 1) * _vars.paginacion;
            return _vars;
        }

        /**
         * @name next
         * @description Ir a pr�xima p�gina
         * @returns {*}
         * uso agregar un metodo
         vm.next = function () {
                vm.start = UserService.next().start;
                vm.pagina = UserVars.pagina;
            };
         */
        function next(_vars) {
            if (_vars.pagina + 1 > _vars.paginas) {
                return goToPagina(_vars.pagina, _vars);
            }
            return goToPagina(_vars.pagina + 1, _vars);
        }

        /**
         * @name previous
         * @description Ir a p�gina anterior
         * @returns {*}
         * uso, agregar un m�todo
         vm.prev = function () {
                vm.start= UserService.prev().start;
                vm.pagina = UserVars.pagina;
            };
         */
        function prev(_vars) {
            if (_vars.pagina - 1 == 0) {
                return goToPagina(1, _vars);
            }

            return goToPagina(_vars.pagina - 1, _vars);
        }

    }

    ErrorHandler.$inject = ['MvUtils'];
    function ErrorHandler(MvUtils) {
        return function (response) {
            if (response.status == 401) {
                MvUtils.showMessage('error', 'No se encuentra autorizado para llevar a cabo esta acción.');
            } else if (response.status == 400 || response.status == 500) {
                MvUtils.showMessage('error', 'Error: ' + response.status + '. ' + response.data);
            } else {
                MvUtils.showMessage('error', 'Error: ' + response.status + '. Por favor contacte al administrador.');
            }
        }
    }

    /*
     Licensed under the Apache License, Version 2.0 (the "License");
     you may not use this file except in compliance with the License.
     You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

     Unless required by applicable law or agreed to in writing, software
     distributed under the License is distributed on an "AS IS" BASIS,
     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     See the License for the specific language governing permissions and
     limitations under the License.
     */
    var defaultDiacriticsRemovalMap = [
        {'base':'A', 'letters':'\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F'},
        {'base':'AA','letters':'\uA732'},
        {'base':'AE','letters':'\u00C6\u01FC\u01E2'},
        {'base':'AO','letters':'\uA734'},
        {'base':'AU','letters':'\uA736'},
        {'base':'AV','letters':'\uA738\uA73A'},
        {'base':'AY','letters':'\uA73C'},
        {'base':'B', 'letters':'\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181'},
        {'base':'C', 'letters':'\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E'},
        {'base':'D', 'letters':'\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779\u00D0'},
        {'base':'DZ','letters':'\u01F1\u01C4'},
        {'base':'Dz','letters':'\u01F2\u01C5'},
        {'base':'E', 'letters':'\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E'},
        {'base':'F', 'letters':'\u0046\u24BB\uFF26\u1E1E\u0191\uA77B'},
        {'base':'G', 'letters':'\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E'},
        {'base':'H', 'letters':'\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D'},
        {'base':'I', 'letters':'\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197'},
        {'base':'J', 'letters':'\u004A\u24BF\uFF2A\u0134\u0248'},
        {'base':'K', 'letters':'\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2'},
        {'base':'L', 'letters':'\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780'},
        {'base':'LJ','letters':'\u01C7'},
        {'base':'Lj','letters':'\u01C8'},
        {'base':'M', 'letters':'\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C'},
        {'base':'N', 'letters':'\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4'},
        {'base':'NJ','letters':'\u01CA'},
        {'base':'Nj','letters':'\u01CB'},
        {'base':'O', 'letters':'\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C'},
        {'base':'OI','letters':'\u01A2'},
        {'base':'OO','letters':'\uA74E'},
        {'base':'OU','letters':'\u0222'},
        {'base':'OE','letters':'\u008C\u0152'},
        {'base':'oe','letters':'\u009C\u0153'},
        {'base':'P', 'letters':'\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754'},
        {'base':'Q', 'letters':'\u0051\u24C6\uFF31\uA756\uA758\u024A'},
        {'base':'R', 'letters':'\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782'},
        {'base':'S', 'letters':'\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784'},
        {'base':'T', 'letters':'\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786'},
        {'base':'TZ','letters':'\uA728'},
        {'base':'U', 'letters':'\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244'},
        {'base':'V', 'letters':'\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245'},
        {'base':'VY','letters':'\uA760'},
        {'base':'W', 'letters':'\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72'},
        {'base':'X', 'letters':'\u0058\u24CD\uFF38\u1E8A\u1E8C'},
        {'base':'Y', 'letters':'\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE'},
        {'base':'Z', 'letters':'\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762'},
        {'base':'a', 'letters':'\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250'},
        {'base':'aa','letters':'\uA733'},
        {'base':'ae','letters':'\u00E6\u01FD\u01E3'},
        {'base':'ao','letters':'\uA735'},
        {'base':'au','letters':'\uA737'},
        {'base':'av','letters':'\uA739\uA73B'},
        {'base':'ay','letters':'\uA73D'},
        {'base':'b', 'letters':'\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253'},
        {'base':'c', 'letters':'\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184'},
        {'base':'d', 'letters':'\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A'},
        {'base':'dz','letters':'\u01F3\u01C6'},
        {'base':'e', 'letters':'\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD'},
        {'base':'f', 'letters':'\u0066\u24D5\uFF46\u1E1F\u0192\uA77C'},
        {'base':'g', 'letters':'\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F'},
        {'base':'h', 'letters':'\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265'},
        {'base':'hv','letters':'\u0195'},
        {'base':'i', 'letters':'\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131'},
        {'base':'j', 'letters':'\u006A\u24D9\uFF4A\u0135\u01F0\u0249'},
        {'base':'k', 'letters':'\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3'},
        {'base':'l', 'letters':'\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747'},
        {'base':'lj','letters':'\u01C9'},
        {'base':'m', 'letters':'\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F'},
        {'base':'n', 'letters':'\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5'},
        {'base':'nj','letters':'\u01CC'},
        {'base':'o', 'letters':'\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275'},
        {'base':'oi','letters':'\u01A3'},
        {'base':'ou','letters':'\u0223'},
        {'base':'oo','letters':'\uA74F'},
        {'base':'p','letters':'\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755'},
        {'base':'q','letters':'\u0071\u24E0\uFF51\u024B\uA757\uA759'},
        {'base':'r','letters':'\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783'},
        {'base':'s','letters':'\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B'},
        {'base':'t','letters':'\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787'},
        {'base':'tz','letters':'\uA729'},
        {'base':'u','letters': '\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289'},
        {'base':'v','letters':'\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C'},
        {'base':'vy','letters':'\uA761'},
        {'base':'w','letters':'\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73'},
        {'base':'x','letters':'\u0078\u24E7\uFF58\u1E8B\u1E8D'},
        {'base':'y','letters':'\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF'},
        {'base':'z','letters':'\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763'}
    ];

    var diacriticsMap = {};
    for (var i=0; i < defaultDiacriticsRemovalMap .length; i++){
        var letters = defaultDiacriticsRemovalMap [i].letters;
        for (var j=0; j < letters.length ; j++){
            diacriticsMap[letters[j]] = defaultDiacriticsRemovalMap [i].base;
        }
    }

    // "what?" version ... http://jsperf.com/diacritics/12
    function removeDiacritics (str) {
        return str.replace(/[^\u0000-\u007E]/g, function(a){
            return diacriticsMap[a] || a;
        });
    }

})();


/*
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 */

var dateFormat = function () {
    var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
        timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
        timezoneClip = /[^-+\dA-Z]/g,
        pad = function (val, len) {
            val = String(val);
            len = len || 2;
            while (val.length < len) val = "0" + val;
            return val;
        };

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc) {
        var dF = dateFormat;

        // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
        if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }
        // Passing date through Date applies Date.parse, if necessary
        date = date ? new Date(date) : new Date();

        if (isNaN(date) && !(typeof InstallTrigger !== 'undefined')) throw SyntaxError("invalid date");

        mask = String(dF.masks[mask] || mask || dF.masks["default"]);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) == "UTC:") {
            mask = mask.slice(4);
            utc = true;
        }

        var _ = utc ? "getUTC" : "get",
            d = date[_ + "Date"](),
            D = date[_ + "Day"](),
            m = date[_ + "Month"](),
            y = date[_ + "FullYear"](),
            H = date[_ + "Hours"](),
            M = date[_ + "Minutes"](),
            s = date[_ + "Seconds"](),
            L = date[_ + "Milliseconds"](),
            o = utc ? 0 : date.getTimezoneOffset(),
            flags = {
                d: d,
                dd: pad(d),
                ddd: dF.i18n.dayNames[D],
                dddd: dF.i18n.dayNames[D + 7],
                m: m + 1,
                mm: pad(m + 1),
                mmm: dF.i18n.monthNames[m],
                mmmm: dF.i18n.monthNames[m + 12],
                yy: String(y).slice(2),
                yyyy: y,
                h: H % 12 || 12,
                hh: pad(H % 12 || 12),
                H: H,
                HH: pad(H),
                M: M,
                MM: pad(M),
                s: s,
                ss: pad(s),
                l: pad(L, 3),
                L: pad(L > 99 ? Math.round(L / 10) : L),
                t: H < 12 ? "a" : "p",
                tt: H < 12 ? "am" : "pm",
                T: H < 12 ? "A" : "P",
                TT: H < 12 ? "AM" : "PM",
                Z: utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                S: ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
            };

        return mask.replace(token, function ($0) {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
    };
}();

// Some common format strings
dateFormat.masks = {
    "default": "ddd mmm dd yyyy HH:MM:ss",
    shortDate: "m/d/yy",
    mediumDate: "mmm d, yyyy",
    longDate: "mmmm d, yyyy",
    fullDate: "dddd, mmmm d, yyyy",
    shortTime: "h:MM TT",
    mediumTime: "h:MM:ss TT",
    longTime: "h:MM:ss TT Z",
    isoDate: "yyyy-mm-dd",
    isoTime: "HH:MM:ss",
    isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
    isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
    dayNames: [
        "Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab",
        "Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"
    ],
    monthNames: [
        "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]
};

// For convenience...
Date.prototype.format = function (mask, utc) {
    return dateFormat(this, mask, utc);
};
