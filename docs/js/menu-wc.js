'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">病害智能诊断系统服务文档</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AiServiceModule.html" data-type="entity-link" >AiServiceModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AiServiceModule-6723dfa45db509508c63491d923efc43b1c0790b4554efc3dc03d6e8da5110f239011c900f938e8d631f101d6de6655a54d7947f3a82b2c8f652f23bf7673ad1"' : 'data-bs-target="#xs-controllers-links-module-AiServiceModule-6723dfa45db509508c63491d923efc43b1c0790b4554efc3dc03d6e8da5110f239011c900f938e8d631f101d6de6655a54d7947f3a82b2c8f652f23bf7673ad1"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AiServiceModule-6723dfa45db509508c63491d923efc43b1c0790b4554efc3dc03d6e8da5110f239011c900f938e8d631f101d6de6655a54d7947f3a82b2c8f652f23bf7673ad1"' :
                                            'id="xs-controllers-links-module-AiServiceModule-6723dfa45db509508c63491d923efc43b1c0790b4554efc3dc03d6e8da5110f239011c900f938e8d631f101d6de6655a54d7947f3a82b2c8f652f23bf7673ad1"' }>
                                            <li class="link">
                                                <a href="controllers/AiServiceController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AiServiceController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AiServiceModule-6723dfa45db509508c63491d923efc43b1c0790b4554efc3dc03d6e8da5110f239011c900f938e8d631f101d6de6655a54d7947f3a82b2c8f652f23bf7673ad1"' : 'data-bs-target="#xs-injectables-links-module-AiServiceModule-6723dfa45db509508c63491d923efc43b1c0790b4554efc3dc03d6e8da5110f239011c900f938e8d631f101d6de6655a54d7947f3a82b2c8f652f23bf7673ad1"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AiServiceModule-6723dfa45db509508c63491d923efc43b1c0790b4554efc3dc03d6e8da5110f239011c900f938e8d631f101d6de6655a54d7947f3a82b2c8f652f23bf7673ad1"' :
                                        'id="xs-injectables-links-module-AiServiceModule-6723dfa45db509508c63491d923efc43b1c0790b4554efc3dc03d6e8da5110f239011c900f938e8d631f101d6de6655a54d7947f3a82b2c8f652f23bf7673ad1"' }>
                                        <li class="link">
                                            <a href="injectables/AiServiceService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AiServiceService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AppModule-52948342d32f993c6bf4d892812ba813499c29615c6a051c87d3fe8b57e556ba8c993ea50a9e8b5c4210f2637a33ca616b544e64cd34e789c5b72f8b8a5cbcc6"' : 'data-bs-target="#xs-controllers-links-module-AppModule-52948342d32f993c6bf4d892812ba813499c29615c6a051c87d3fe8b57e556ba8c993ea50a9e8b5c4210f2637a33ca616b544e64cd34e789c5b72f8b8a5cbcc6"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AppModule-52948342d32f993c6bf4d892812ba813499c29615c6a051c87d3fe8b57e556ba8c993ea50a9e8b5c4210f2637a33ca616b544e64cd34e789c5b72f8b8a5cbcc6"' :
                                            'id="xs-controllers-links-module-AppModule-52948342d32f993c6bf4d892812ba813499c29615c6a051c87d3fe8b57e556ba8c993ea50a9e8b5c4210f2637a33ca616b544e64cd34e789c5b72f8b8a5cbcc6"' }>
                                            <li class="link">
                                                <a href="controllers/AppController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AppModule-52948342d32f993c6bf4d892812ba813499c29615c6a051c87d3fe8b57e556ba8c993ea50a9e8b5c4210f2637a33ca616b544e64cd34e789c5b72f8b8a5cbcc6"' : 'data-bs-target="#xs-injectables-links-module-AppModule-52948342d32f993c6bf4d892812ba813499c29615c6a051c87d3fe8b57e556ba8c993ea50a9e8b5c4210f2637a33ca616b544e64cd34e789c5b72f8b8a5cbcc6"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-52948342d32f993c6bf4d892812ba813499c29615c6a051c87d3fe8b57e556ba8c993ea50a9e8b5c4210f2637a33ca616b544e64cd34e789c5b72f8b8a5cbcc6"' :
                                        'id="xs-injectables-links-module-AppModule-52948342d32f993c6bf4d892812ba813499c29615c6a051c87d3fe8b57e556ba8c993ea50a9e8b5c4210f2637a33ca616b544e64cd34e789c5b72f8b8a5cbcc6"' }>
                                        <li class="link">
                                            <a href="injectables/AppService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AuthModule.html" data-type="entity-link" >AuthModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AuthModule-5a6c034dbb3019451063bb05f53147f5bfe28abae87e12e100fa769e5514589ee15f470a3fd30b898e739a3510de733a5a95d578f9ee5a5ca7f82a8cbbce01bc"' : 'data-bs-target="#xs-controllers-links-module-AuthModule-5a6c034dbb3019451063bb05f53147f5bfe28abae87e12e100fa769e5514589ee15f470a3fd30b898e739a3510de733a5a95d578f9ee5a5ca7f82a8cbbce01bc"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AuthModule-5a6c034dbb3019451063bb05f53147f5bfe28abae87e12e100fa769e5514589ee15f470a3fd30b898e739a3510de733a5a95d578f9ee5a5ca7f82a8cbbce01bc"' :
                                            'id="xs-controllers-links-module-AuthModule-5a6c034dbb3019451063bb05f53147f5bfe28abae87e12e100fa769e5514589ee15f470a3fd30b898e739a3510de733a5a95d578f9ee5a5ca7f82a8cbbce01bc"' }>
                                            <li class="link">
                                                <a href="controllers/AuthController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AuthModule-5a6c034dbb3019451063bb05f53147f5bfe28abae87e12e100fa769e5514589ee15f470a3fd30b898e739a3510de733a5a95d578f9ee5a5ca7f82a8cbbce01bc"' : 'data-bs-target="#xs-injectables-links-module-AuthModule-5a6c034dbb3019451063bb05f53147f5bfe28abae87e12e100fa769e5514589ee15f470a3fd30b898e739a3510de733a5a95d578f9ee5a5ca7f82a8cbbce01bc"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AuthModule-5a6c034dbb3019451063bb05f53147f5bfe28abae87e12e100fa769e5514589ee15f470a3fd30b898e739a3510de733a5a95d578f9ee5a5ca7f82a8cbbce01bc"' :
                                        'id="xs-injectables-links-module-AuthModule-5a6c034dbb3019451063bb05f53147f5bfe28abae87e12e100fa769e5514589ee15f470a3fd30b898e739a3510de733a5a95d578f9ee5a5ca7f82a8cbbce01bc"' }>
                                        <li class="link">
                                            <a href="injectables/AuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/JwtStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >JwtStrategy</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/DatasetModule.html" data-type="entity-link" >DatasetModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-DatasetModule-8d46e5fc070ae18a70fde60f56cb7ae6aad1b23ff0d4392deb462a7054d122db299d5df7aa311dc23ff0c85abd4ac78fc8ecfb9900b2d68eefaa304f7b2b3c3b"' : 'data-bs-target="#xs-controllers-links-module-DatasetModule-8d46e5fc070ae18a70fde60f56cb7ae6aad1b23ff0d4392deb462a7054d122db299d5df7aa311dc23ff0c85abd4ac78fc8ecfb9900b2d68eefaa304f7b2b3c3b"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-DatasetModule-8d46e5fc070ae18a70fde60f56cb7ae6aad1b23ff0d4392deb462a7054d122db299d5df7aa311dc23ff0c85abd4ac78fc8ecfb9900b2d68eefaa304f7b2b3c3b"' :
                                            'id="xs-controllers-links-module-DatasetModule-8d46e5fc070ae18a70fde60f56cb7ae6aad1b23ff0d4392deb462a7054d122db299d5df7aa311dc23ff0c85abd4ac78fc8ecfb9900b2d68eefaa304f7b2b3c3b"' }>
                                            <li class="link">
                                                <a href="controllers/DatasetController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DatasetController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-DatasetModule-8d46e5fc070ae18a70fde60f56cb7ae6aad1b23ff0d4392deb462a7054d122db299d5df7aa311dc23ff0c85abd4ac78fc8ecfb9900b2d68eefaa304f7b2b3c3b"' : 'data-bs-target="#xs-injectables-links-module-DatasetModule-8d46e5fc070ae18a70fde60f56cb7ae6aad1b23ff0d4392deb462a7054d122db299d5df7aa311dc23ff0c85abd4ac78fc8ecfb9900b2d68eefaa304f7b2b3c3b"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-DatasetModule-8d46e5fc070ae18a70fde60f56cb7ae6aad1b23ff0d4392deb462a7054d122db299d5df7aa311dc23ff0c85abd4ac78fc8ecfb9900b2d68eefaa304f7b2b3c3b"' :
                                        'id="xs-injectables-links-module-DatasetModule-8d46e5fc070ae18a70fde60f56cb7ae6aad1b23ff0d4392deb462a7054d122db299d5df7aa311dc23ff0c85abd4ac78fc8ecfb9900b2d68eefaa304f7b2b3c3b"' }>
                                        <li class="link">
                                            <a href="injectables/DatasetManageService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DatasetManageService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/DatasetService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DatasetService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/DiagnosisModule.html" data-type="entity-link" >DiagnosisModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-DiagnosisModule-7a6d7f64cab8bc784eb1c2f2a4a1de66ba152ef017917f009e3e84ae2cf0de33e38757499a180dc62a3bf4b64c4e7709debe239bd6f50547f4a37405cb5b70b0"' : 'data-bs-target="#xs-controllers-links-module-DiagnosisModule-7a6d7f64cab8bc784eb1c2f2a4a1de66ba152ef017917f009e3e84ae2cf0de33e38757499a180dc62a3bf4b64c4e7709debe239bd6f50547f4a37405cb5b70b0"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-DiagnosisModule-7a6d7f64cab8bc784eb1c2f2a4a1de66ba152ef017917f009e3e84ae2cf0de33e38757499a180dc62a3bf4b64c4e7709debe239bd6f50547f4a37405cb5b70b0"' :
                                            'id="xs-controllers-links-module-DiagnosisModule-7a6d7f64cab8bc784eb1c2f2a4a1de66ba152ef017917f009e3e84ae2cf0de33e38757499a180dc62a3bf4b64c4e7709debe239bd6f50547f4a37405cb5b70b0"' }>
                                            <li class="link">
                                                <a href="controllers/DiagnosisController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DiagnosisController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-DiagnosisModule-7a6d7f64cab8bc784eb1c2f2a4a1de66ba152ef017917f009e3e84ae2cf0de33e38757499a180dc62a3bf4b64c4e7709debe239bd6f50547f4a37405cb5b70b0"' : 'data-bs-target="#xs-injectables-links-module-DiagnosisModule-7a6d7f64cab8bc784eb1c2f2a4a1de66ba152ef017917f009e3e84ae2cf0de33e38757499a180dc62a3bf4b64c4e7709debe239bd6f50547f4a37405cb5b70b0"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-DiagnosisModule-7a6d7f64cab8bc784eb1c2f2a4a1de66ba152ef017917f009e3e84ae2cf0de33e38757499a180dc62a3bf4b64c4e7709debe239bd6f50547f4a37405cb5b70b0"' :
                                        'id="xs-injectables-links-module-DiagnosisModule-7a6d7f64cab8bc784eb1c2f2a4a1de66ba152ef017917f009e3e84ae2cf0de33e38757499a180dc62a3bf4b64c4e7709debe239bd6f50547f4a37405cb5b70b0"' }>
                                        <li class="link">
                                            <a href="injectables/DiagnosisService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DiagnosisService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/FileModule.html" data-type="entity-link" >FileModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-FileModule-fd2d66b24b7cd6df068c0d0d38487af41258e290cf73941e6a846b51a2c3166c05c1242f71a5a025ae80976ffbec7133f0cd90e6704a0de3ba87b3edf9ad1436"' : 'data-bs-target="#xs-controllers-links-module-FileModule-fd2d66b24b7cd6df068c0d0d38487af41258e290cf73941e6a846b51a2c3166c05c1242f71a5a025ae80976ffbec7133f0cd90e6704a0de3ba87b3edf9ad1436"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-FileModule-fd2d66b24b7cd6df068c0d0d38487af41258e290cf73941e6a846b51a2c3166c05c1242f71a5a025ae80976ffbec7133f0cd90e6704a0de3ba87b3edf9ad1436"' :
                                            'id="xs-controllers-links-module-FileModule-fd2d66b24b7cd6df068c0d0d38487af41258e290cf73941e6a846b51a2c3166c05c1242f71a5a025ae80976ffbec7133f0cd90e6704a0de3ba87b3edf9ad1436"' }>
                                            <li class="link">
                                                <a href="controllers/FileController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FileController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-FileModule-fd2d66b24b7cd6df068c0d0d38487af41258e290cf73941e6a846b51a2c3166c05c1242f71a5a025ae80976ffbec7133f0cd90e6704a0de3ba87b3edf9ad1436"' : 'data-bs-target="#xs-injectables-links-module-FileModule-fd2d66b24b7cd6df068c0d0d38487af41258e290cf73941e6a846b51a2c3166c05c1242f71a5a025ae80976ffbec7133f0cd90e6704a0de3ba87b3edf9ad1436"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-FileModule-fd2d66b24b7cd6df068c0d0d38487af41258e290cf73941e6a846b51a2c3166c05c1242f71a5a025ae80976ffbec7133f0cd90e6704a0de3ba87b3edf9ad1436"' :
                                        'id="xs-injectables-links-module-FileModule-fd2d66b24b7cd6df068c0d0d38487af41258e290cf73941e6a846b51a2c3166c05c1242f71a5a025ae80976ffbec7133f0cd90e6704a0de3ba87b3edf9ad1436"' }>
                                        <li class="link">
                                            <a href="injectables/FileDownloadService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FileDownloadService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FileManageService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FileManageService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FileOperationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FileOperationService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FileService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FileService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FileStorageService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FileStorageService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FileUploadService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FileUploadService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/KnowledgeModule.html" data-type="entity-link" >KnowledgeModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-KnowledgeModule-525b71198f53317ad476ec6c19c796fd12f00c692a2d635c69c50ea8d462689b8a6740f98f33ea8a104013281289af4be39bc02ff06b7bf2c68784d84610d75c"' : 'data-bs-target="#xs-controllers-links-module-KnowledgeModule-525b71198f53317ad476ec6c19c796fd12f00c692a2d635c69c50ea8d462689b8a6740f98f33ea8a104013281289af4be39bc02ff06b7bf2c68784d84610d75c"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-KnowledgeModule-525b71198f53317ad476ec6c19c796fd12f00c692a2d635c69c50ea8d462689b8a6740f98f33ea8a104013281289af4be39bc02ff06b7bf2c68784d84610d75c"' :
                                            'id="xs-controllers-links-module-KnowledgeModule-525b71198f53317ad476ec6c19c796fd12f00c692a2d635c69c50ea8d462689b8a6740f98f33ea8a104013281289af4be39bc02ff06b7bf2c68784d84610d75c"' }>
                                            <li class="link">
                                                <a href="controllers/KnowledgeController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >KnowledgeController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-KnowledgeModule-525b71198f53317ad476ec6c19c796fd12f00c692a2d635c69c50ea8d462689b8a6740f98f33ea8a104013281289af4be39bc02ff06b7bf2c68784d84610d75c"' : 'data-bs-target="#xs-injectables-links-module-KnowledgeModule-525b71198f53317ad476ec6c19c796fd12f00c692a2d635c69c50ea8d462689b8a6740f98f33ea8a104013281289af4be39bc02ff06b7bf2c68784d84610d75c"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-KnowledgeModule-525b71198f53317ad476ec6c19c796fd12f00c692a2d635c69c50ea8d462689b8a6740f98f33ea8a104013281289af4be39bc02ff06b7bf2c68784d84610d75c"' :
                                        'id="xs-injectables-links-module-KnowledgeModule-525b71198f53317ad476ec6c19c796fd12f00c692a2d635c69c50ea8d462689b8a6740f98f33ea8a104013281289af4be39bc02ff06b7bf2c68784d84610d75c"' }>
                                        <li class="link">
                                            <a href="injectables/KnowledgeManageService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >KnowledgeManageService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/KnowledgeService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >KnowledgeService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/MenuModule.html" data-type="entity-link" >MenuModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-MenuModule-614a04bc9c983fa2b5195eefc6cbd783b59ac7d096f571be699fe00810bd58b294f6b92facc5ffebd1aa21c92cf5b6b547b395e68bf439d6621b5f7441304278"' : 'data-bs-target="#xs-controllers-links-module-MenuModule-614a04bc9c983fa2b5195eefc6cbd783b59ac7d096f571be699fe00810bd58b294f6b92facc5ffebd1aa21c92cf5b6b547b395e68bf439d6621b5f7441304278"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-MenuModule-614a04bc9c983fa2b5195eefc6cbd783b59ac7d096f571be699fe00810bd58b294f6b92facc5ffebd1aa21c92cf5b6b547b395e68bf439d6621b5f7441304278"' :
                                            'id="xs-controllers-links-module-MenuModule-614a04bc9c983fa2b5195eefc6cbd783b59ac7d096f571be699fe00810bd58b294f6b92facc5ffebd1aa21c92cf5b6b547b395e68bf439d6621b5f7441304278"' }>
                                            <li class="link">
                                                <a href="controllers/MenuController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-MenuModule-614a04bc9c983fa2b5195eefc6cbd783b59ac7d096f571be699fe00810bd58b294f6b92facc5ffebd1aa21c92cf5b6b547b395e68bf439d6621b5f7441304278"' : 'data-bs-target="#xs-injectables-links-module-MenuModule-614a04bc9c983fa2b5195eefc6cbd783b59ac7d096f571be699fe00810bd58b294f6b92facc5ffebd1aa21c92cf5b6b547b395e68bf439d6621b5f7441304278"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-MenuModule-614a04bc9c983fa2b5195eefc6cbd783b59ac7d096f571be699fe00810bd58b294f6b92facc5ffebd1aa21c92cf5b6b547b395e68bf439d6621b5f7441304278"' :
                                        'id="xs-injectables-links-module-MenuModule-614a04bc9c983fa2b5195eefc6cbd783b59ac7d096f571be699fe00810bd58b294f6b92facc5ffebd1aa21c92cf5b6b547b395e68bf439d6621b5f7441304278"' }>
                                        <li class="link">
                                            <a href="injectables/MenuService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/RoleModule.html" data-type="entity-link" >RoleModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-RoleModule-851422865948093b650c76015129fa0d3c0396ec90c31430931dbaf1fc3d150e287945ed8d65dbe8824b34d7e018b59af7018b5bb6c7e1862d346c80c115d34d"' : 'data-bs-target="#xs-controllers-links-module-RoleModule-851422865948093b650c76015129fa0d3c0396ec90c31430931dbaf1fc3d150e287945ed8d65dbe8824b34d7e018b59af7018b5bb6c7e1862d346c80c115d34d"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-RoleModule-851422865948093b650c76015129fa0d3c0396ec90c31430931dbaf1fc3d150e287945ed8d65dbe8824b34d7e018b59af7018b5bb6c7e1862d346c80c115d34d"' :
                                            'id="xs-controllers-links-module-RoleModule-851422865948093b650c76015129fa0d3c0396ec90c31430931dbaf1fc3d150e287945ed8d65dbe8824b34d7e018b59af7018b5bb6c7e1862d346c80c115d34d"' }>
                                            <li class="link">
                                                <a href="controllers/RoleController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RoleController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-RoleModule-851422865948093b650c76015129fa0d3c0396ec90c31430931dbaf1fc3d150e287945ed8d65dbe8824b34d7e018b59af7018b5bb6c7e1862d346c80c115d34d"' : 'data-bs-target="#xs-injectables-links-module-RoleModule-851422865948093b650c76015129fa0d3c0396ec90c31430931dbaf1fc3d150e287945ed8d65dbe8824b34d7e018b59af7018b5bb6c7e1862d346c80c115d34d"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-RoleModule-851422865948093b650c76015129fa0d3c0396ec90c31430931dbaf1fc3d150e287945ed8d65dbe8824b34d7e018b59af7018b5bb6c7e1862d346c80c115d34d"' :
                                        'id="xs-injectables-links-module-RoleModule-851422865948093b650c76015129fa0d3c0396ec90c31430931dbaf1fc3d150e287945ed8d65dbe8824b34d7e018b59af7018b5bb6c7e1862d346c80c115d34d"' }>
                                        <li class="link">
                                            <a href="injectables/RoleService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RoleService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/UserModule.html" data-type="entity-link" >UserModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-UserModule-ce1c6e4eadf7661a1b7f6848585b8b65a77ed7a8b319947dc3f1625a6cf1ccd2e667f632756ee4afe245ee684fd8f6022708c4a6a8aac6647d59f6d102e100dc"' : 'data-bs-target="#xs-controllers-links-module-UserModule-ce1c6e4eadf7661a1b7f6848585b8b65a77ed7a8b319947dc3f1625a6cf1ccd2e667f632756ee4afe245ee684fd8f6022708c4a6a8aac6647d59f6d102e100dc"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-UserModule-ce1c6e4eadf7661a1b7f6848585b8b65a77ed7a8b319947dc3f1625a6cf1ccd2e667f632756ee4afe245ee684fd8f6022708c4a6a8aac6647d59f6d102e100dc"' :
                                            'id="xs-controllers-links-module-UserModule-ce1c6e4eadf7661a1b7f6848585b8b65a77ed7a8b319947dc3f1625a6cf1ccd2e667f632756ee4afe245ee684fd8f6022708c4a6a8aac6647d59f6d102e100dc"' }>
                                            <li class="link">
                                                <a href="controllers/UserController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-UserModule-ce1c6e4eadf7661a1b7f6848585b8b65a77ed7a8b319947dc3f1625a6cf1ccd2e667f632756ee4afe245ee684fd8f6022708c4a6a8aac6647d59f6d102e100dc"' : 'data-bs-target="#xs-injectables-links-module-UserModule-ce1c6e4eadf7661a1b7f6848585b8b65a77ed7a8b319947dc3f1625a6cf1ccd2e667f632756ee4afe245ee684fd8f6022708c4a6a8aac6647d59f6d102e100dc"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UserModule-ce1c6e4eadf7661a1b7f6848585b8b65a77ed7a8b319947dc3f1625a6cf1ccd2e667f632756ee4afe245ee684fd8f6022708c4a6a8aac6647d59f6d102e100dc"' :
                                        'id="xs-injectables-links-module-UserModule-ce1c6e4eadf7661a1b7f6848585b8b65a77ed7a8b319947dc3f1625a6cf1ccd2e667f632756ee4afe245ee684fd8f6022708c4a6a8aac6647d59f6d102e100dc"' }>
                                        <li class="link">
                                            <a href="injectables/UserService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                </ul>
                </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#controllers-links"' :
                                'data-bs-target="#xs-controllers-links"' }>
                                <span class="icon ion-md-swap"></span>
                                <span>Controllers</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="controllers-links"' : 'id="xs-controllers-links"' }>
                                <li class="link">
                                    <a href="controllers/AiServiceController.html" data-type="entity-link" >AiServiceController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/AppController.html" data-type="entity-link" >AppController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/AuthController.html" data-type="entity-link" >AuthController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/DatasetController.html" data-type="entity-link" >DatasetController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/DiagnosisController.html" data-type="entity-link" >DiagnosisController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/FileController.html" data-type="entity-link" >FileController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/KnowledgeController.html" data-type="entity-link" >KnowledgeController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/MenuController.html" data-type="entity-link" >MenuController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/RoleController.html" data-type="entity-link" >RoleController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/UserController.html" data-type="entity-link" >UserController</a>
                                </li>
                            </ul>
                        </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#entities-links"' :
                                'data-bs-target="#xs-entities-links"' }>
                                <span class="icon ion-ios-apps"></span>
                                <span>Entities</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="entities-links"' : 'id="xs-entities-links"' }>
                                <li class="link">
                                    <a href="entities/AiService.html" data-type="entity-link" >AiService</a>
                                </li>
                                <li class="link">
                                    <a href="entities/AiServiceAccessLog.html" data-type="entity-link" >AiServiceAccessLog</a>
                                </li>
                                <li class="link">
                                    <a href="entities/AiServiceConfig.html" data-type="entity-link" >AiServiceConfig</a>
                                </li>
                                <li class="link">
                                    <a href="entities/AiServiceLog.html" data-type="entity-link" >AiServiceLog</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Dataset.html" data-type="entity-link" >Dataset</a>
                                </li>
                                <li class="link">
                                    <a href="entities/DiagnosisHistory.html" data-type="entity-link" >DiagnosisHistory</a>
                                </li>
                                <li class="link">
                                    <a href="entities/File.html" data-type="entity-link" >File</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Menu.html" data-type="entity-link" >Menu</a>
                                </li>
                                <li class="link">
                                    <a href="entities/PlantDiseaseKnowledge.html" data-type="entity-link" >PlantDiseaseKnowledge</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Profile.html" data-type="entity-link" >Profile</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Role.html" data-type="entity-link" >Role</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Task.html" data-type="entity-link" >Task</a>
                                </li>
                                <li class="link">
                                    <a href="entities/User.html" data-type="entity-link" >User</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/AiService.html" data-type="entity-link" >AiService</a>
                            </li>
                            <li class="link">
                                <a href="classes/CompleteChunkDto.html" data-type="entity-link" >CompleteChunkDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateAiServiceDto.html" data-type="entity-link" >CreateAiServiceDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateDatasetDto.html" data-type="entity-link" >CreateDatasetDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreatePlantDiseaseKnowledgeDto.html" data-type="entity-link" >CreatePlantDiseaseKnowledgeDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateRoleDto.html" data-type="entity-link" >CreateRoleDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateTaskDto.html" data-type="entity-link" >CreateTaskDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateTempLinkDto.html" data-type="entity-link" >CreateTempLinkDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateUserDto.html" data-type="entity-link" >CreateUserDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/Dataset.html" data-type="entity-link" >Dataset</a>
                            </li>
                            <li class="link">
                                <a href="classes/DiagnosisHistory.html" data-type="entity-link" >DiagnosisHistory</a>
                            </li>
                            <li class="link">
                                <a href="classes/DownloadFilesDto.html" data-type="entity-link" >DownloadFilesDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/File.html" data-type="entity-link" >File</a>
                            </li>
                            <li class="link">
                                <a href="classes/HttpExceptionFilter.html" data-type="entity-link" >HttpExceptionFilter</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginDto.html" data-type="entity-link" >LoginDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/PlantDiseaseKnowledge.html" data-type="entity-link" >PlantDiseaseKnowledge</a>
                            </li>
                            <li class="link">
                                <a href="classes/RegisterDto.html" data-type="entity-link" >RegisterDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ResetPasswordDto.html" data-type="entity-link" >ResetPasswordDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/TypeormFilter.html" data-type="entity-link" >TypeormFilter</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateAiServiceDto.html" data-type="entity-link" >UpdateAiServiceDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateDatasetDto.html" data-type="entity-link" >UpdateDatasetDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateFileDto.html" data-type="entity-link" >UpdateFileDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateFilesAccessDto.html" data-type="entity-link" >UpdateFilesAccessDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdatePasswordDto.html" data-type="entity-link" >UpdatePasswordDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdatePlantDiseaseKnowledgeDto.html" data-type="entity-link" >UpdatePlantDiseaseKnowledgeDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateProfileDto.html" data-type="entity-link" >UpdateProfileDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateRoleDto.html" data-type="entity-link" >UpdateRoleDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateUserDto.html" data-type="entity-link" >UpdateUserDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UploadChunkDto.html" data-type="entity-link" >UploadChunkDto</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AiServiceService.html" data-type="entity-link" >AiServiceService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AppService.html" data-type="entity-link" >AppService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthGuard.html" data-type="entity-link" >AuthGuard</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthService.html" data-type="entity-link" >AuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DatasetManageService.html" data-type="entity-link" >DatasetManageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DatasetService.html" data-type="entity-link" >DatasetService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DiagnosisService.html" data-type="entity-link" >DiagnosisService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FileDownloadService.html" data-type="entity-link" >FileDownloadService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FileManageService.html" data-type="entity-link" >FileManageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FileOperationService.html" data-type="entity-link" >FileOperationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FileService.html" data-type="entity-link" >FileService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FileSizeValidationPipe.html" data-type="entity-link" >FileSizeValidationPipe</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FileStorageService.html" data-type="entity-link" >FileStorageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FileTypeValidationPipe.html" data-type="entity-link" >FileTypeValidationPipe</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FileUploadService.html" data-type="entity-link" >FileUploadService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/JwtStrategy.html" data-type="entity-link" >JwtStrategy</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/KnowledgeManageService.html" data-type="entity-link" >KnowledgeManageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/KnowledgeService.html" data-type="entity-link" >KnowledgeService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MenuService.html" data-type="entity-link" >MenuService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ParseFileIdsPipe.html" data-type="entity-link" >ParseFileIdsPipe</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ParseFileTypePipe.html" data-type="entity-link" >ParseFileTypePipe</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ParseStringDatePipe.html" data-type="entity-link" >ParseStringDatePipe</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RoleService.html" data-type="entity-link" >RoleService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserService.html" data-type="entity-link" >UserService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#guards-links"' :
                            'data-bs-target="#xs-guards-links"' }>
                            <span class="icon ion-ios-lock"></span>
                            <span>Guards</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="guards-links"' : 'id="xs-guards-links"' }>
                            <li class="link">
                                <a href="guards/FileGuard.html" data-type="entity-link" >FileGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/FilesGuard.html" data-type="entity-link" >FilesGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/RolesGuard.html" data-type="entity-link" >RolesGuard</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/ApiResponse.html" data-type="entity-link" >ApiResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Request.html" data-type="entity-link" >Request</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Request-1.html" data-type="entity-link" >Request</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserPayload.html" data-type="entity-link" >UserPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserQuery.html" data-type="entity-link" >UserQuery</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});