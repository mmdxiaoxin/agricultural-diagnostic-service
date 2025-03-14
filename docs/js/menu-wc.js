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
                                <a href="modules/AiModelModule.html" data-type="entity-link" >AiModelModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AiModelModule-fab78a960996bd576deceff1a2c2acc573643bdcdf79496dec6aeccff5596014d713c18ebd86a59fb176150b0ea762cb44d77cc4cc5bef29d647186fed74ea0f"' : 'data-bs-target="#xs-controllers-links-module-AiModelModule-fab78a960996bd576deceff1a2c2acc573643bdcdf79496dec6aeccff5596014d713c18ebd86a59fb176150b0ea762cb44d77cc4cc5bef29d647186fed74ea0f"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AiModelModule-fab78a960996bd576deceff1a2c2acc573643bdcdf79496dec6aeccff5596014d713c18ebd86a59fb176150b0ea762cb44d77cc4cc5bef29d647186fed74ea0f"' :
                                            'id="xs-controllers-links-module-AiModelModule-fab78a960996bd576deceff1a2c2acc573643bdcdf79496dec6aeccff5596014d713c18ebd86a59fb176150b0ea762cb44d77cc4cc5bef29d647186fed74ea0f"' }>
                                            <li class="link">
                                                <a href="controllers/AiModelController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AiModelController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AiModelModule-fab78a960996bd576deceff1a2c2acc573643bdcdf79496dec6aeccff5596014d713c18ebd86a59fb176150b0ea762cb44d77cc4cc5bef29d647186fed74ea0f"' : 'data-bs-target="#xs-injectables-links-module-AiModelModule-fab78a960996bd576deceff1a2c2acc573643bdcdf79496dec6aeccff5596014d713c18ebd86a59fb176150b0ea762cb44d77cc4cc5bef29d647186fed74ea0f"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AiModelModule-fab78a960996bd576deceff1a2c2acc573643bdcdf79496dec6aeccff5596014d713c18ebd86a59fb176150b0ea762cb44d77cc4cc5bef29d647186fed74ea0f"' :
                                        'id="xs-injectables-links-module-AiModelModule-fab78a960996bd576deceff1a2c2acc573643bdcdf79496dec6aeccff5596014d713c18ebd86a59fb176150b0ea762cb44d77cc4cc5bef29d647186fed74ea0f"' }>
                                        <li class="link">
                                            <a href="injectables/AiModelService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AiModelService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AiServiceModule.html" data-type="entity-link" >AiServiceModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AiServiceModule-dcaa1296a59275aecaffa88f84387592641073a07103868687bf2f3286bb838fdbe999320d5df89bf81e4324172fc64ad2fae37208002149b5a715a5e19f2913"' : 'data-bs-target="#xs-controllers-links-module-AiServiceModule-dcaa1296a59275aecaffa88f84387592641073a07103868687bf2f3286bb838fdbe999320d5df89bf81e4324172fc64ad2fae37208002149b5a715a5e19f2913"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AiServiceModule-dcaa1296a59275aecaffa88f84387592641073a07103868687bf2f3286bb838fdbe999320d5df89bf81e4324172fc64ad2fae37208002149b5a715a5e19f2913"' :
                                            'id="xs-controllers-links-module-AiServiceModule-dcaa1296a59275aecaffa88f84387592641073a07103868687bf2f3286bb838fdbe999320d5df89bf81e4324172fc64ad2fae37208002149b5a715a5e19f2913"' }>
                                            <li class="link">
                                                <a href="controllers/AiServiceController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AiServiceController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AiServiceModule-dcaa1296a59275aecaffa88f84387592641073a07103868687bf2f3286bb838fdbe999320d5df89bf81e4324172fc64ad2fae37208002149b5a715a5e19f2913"' : 'data-bs-target="#xs-injectables-links-module-AiServiceModule-dcaa1296a59275aecaffa88f84387592641073a07103868687bf2f3286bb838fdbe999320d5df89bf81e4324172fc64ad2fae37208002149b5a715a5e19f2913"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AiServiceModule-dcaa1296a59275aecaffa88f84387592641073a07103868687bf2f3286bb838fdbe999320d5df89bf81e4324172fc64ad2fae37208002149b5a715a5e19f2913"' :
                                        'id="xs-injectables-links-module-AiServiceModule-dcaa1296a59275aecaffa88f84387592641073a07103868687bf2f3286bb838fdbe999320d5df89bf81e4324172fc64ad2fae37208002149b5a715a5e19f2913"' }>
                                        <li class="link">
                                            <a href="injectables/AiConfigsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AiConfigsService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AiServiceService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AiServiceService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AppModule-66be2682acbeed7b64215461a4f4b69c80ce7d8c896dd11f75651c6e2975746ec5d26d88dd20d193fa9dcc3cde61dd91984442219583ec4330fdb0ad6f6b7582-3"' : 'data-bs-target="#xs-controllers-links-module-AppModule-66be2682acbeed7b64215461a4f4b69c80ce7d8c896dd11f75651c6e2975746ec5d26d88dd20d193fa9dcc3cde61dd91984442219583ec4330fdb0ad6f6b7582-3"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AppModule-66be2682acbeed7b64215461a4f4b69c80ce7d8c896dd11f75651c6e2975746ec5d26d88dd20d193fa9dcc3cde61dd91984442219583ec4330fdb0ad6f6b7582-3"' :
                                            'id="xs-controllers-links-module-AppModule-66be2682acbeed7b64215461a4f4b69c80ce7d8c896dd11f75651c6e2975746ec5d26d88dd20d193fa9dcc3cde61dd91984442219583ec4330fdb0ad6f6b7582-3"' }>
                                            <li class="link">
                                                <a href="controllers/DownloadController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DownloadController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AppModule-66be2682acbeed7b64215461a4f4b69c80ce7d8c896dd11f75651c6e2975746ec5d26d88dd20d193fa9dcc3cde61dd91984442219583ec4330fdb0ad6f6b7582-3"' : 'data-bs-target="#xs-injectables-links-module-AppModule-66be2682acbeed7b64215461a4f4b69c80ce7d8c896dd11f75651c6e2975746ec5d26d88dd20d193fa9dcc3cde61dd91984442219583ec4330fdb0ad6f6b7582-3"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-66be2682acbeed7b64215461a4f4b69c80ce7d8c896dd11f75651c6e2975746ec5d26d88dd20d193fa9dcc3cde61dd91984442219583ec4330fdb0ad6f6b7582-3"' :
                                        'id="xs-injectables-links-module-AppModule-66be2682acbeed7b64215461a4f4b69c80ce7d8c896dd11f75651c6e2975746ec5d26d88dd20d193fa9dcc3cde61dd91984442219583ec4330fdb0ad6f6b7582-3"' }>
                                        <li class="link">
                                            <a href="injectables/DownloadService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DownloadService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AppModule-571075b470985a774ac1893eb4b9a0862724bb1a9dece801a6e3819e0097030733a559cf56ee063e722846457683b7c6786f46098e58a1435fdbeac70c5955d2-4"' : 'data-bs-target="#xs-controllers-links-module-AppModule-571075b470985a774ac1893eb4b9a0862724bb1a9dece801a6e3819e0097030733a559cf56ee063e722846457683b7c6786f46098e58a1435fdbeac70c5955d2-4"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AppModule-571075b470985a774ac1893eb4b9a0862724bb1a9dece801a6e3819e0097030733a559cf56ee063e722846457683b7c6786f46098e58a1435fdbeac70c5955d2-4"' :
                                            'id="xs-controllers-links-module-AppModule-571075b470985a774ac1893eb4b9a0862724bb1a9dece801a6e3819e0097030733a559cf56ee063e722846457683b7c6786f46098e58a1435fdbeac70c5955d2-4"' }>
                                            <li class="link">
                                                <a href="controllers/UploadController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UploadController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AppModule-571075b470985a774ac1893eb4b9a0862724bb1a9dece801a6e3819e0097030733a559cf56ee063e722846457683b7c6786f46098e58a1435fdbeac70c5955d2-4"' : 'data-bs-target="#xs-injectables-links-module-AppModule-571075b470985a774ac1893eb4b9a0862724bb1a9dece801a6e3819e0097030733a559cf56ee063e722846457683b7c6786f46098e58a1435fdbeac70c5955d2-4"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-571075b470985a774ac1893eb4b9a0862724bb1a9dece801a6e3819e0097030733a559cf56ee063e722846457683b7c6786f46098e58a1435fdbeac70c5955d2-4"' :
                                        'id="xs-injectables-links-module-AppModule-571075b470985a774ac1893eb4b9a0862724bb1a9dece801a6e3819e0097030733a559cf56ee063e722846457683b7c6786f46098e58a1435fdbeac70c5955d2-4"' }>
                                        <li class="link">
                                            <a href="injectables/UploadService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UploadService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AppModule-a036bcf441a879b234f3695ba69b5f6ebf0cfff8fa97a74221ff43f8a4c2081afb2a8274b121f526271bf8464c7affd22f2460718bff64ddb231150558d9cb15-6"' : 'data-bs-target="#xs-controllers-links-module-AppModule-a036bcf441a879b234f3695ba69b5f6ebf0cfff8fa97a74221ff43f8a4c2081afb2a8274b121f526271bf8464c7affd22f2460718bff64ddb231150558d9cb15-6"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AppModule-a036bcf441a879b234f3695ba69b5f6ebf0cfff8fa97a74221ff43f8a4c2081afb2a8274b121f526271bf8464c7affd22f2460718bff64ddb231150558d9cb15-6"' :
                                            'id="xs-controllers-links-module-AppModule-a036bcf441a879b234f3695ba69b5f6ebf0cfff8fa97a74221ff43f8a4c2081afb2a8274b121f526271bf8464c7affd22f2460718bff64ddb231150558d9cb15-6"' }>
                                            <li class="link">
                                                <a href="controllers/AppController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AppModule-a036bcf441a879b234f3695ba69b5f6ebf0cfff8fa97a74221ff43f8a4c2081afb2a8274b121f526271bf8464c7affd22f2460718bff64ddb231150558d9cb15-6"' : 'data-bs-target="#xs-injectables-links-module-AppModule-a036bcf441a879b234f3695ba69b5f6ebf0cfff8fa97a74221ff43f8a4c2081afb2a8274b121f526271bf8464c7affd22f2460718bff64ddb231150558d9cb15-6"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-a036bcf441a879b234f3695ba69b5f6ebf0cfff8fa97a74221ff43f8a4c2081afb2a8274b121f526271bf8464c7affd22f2460718bff64ddb231150558d9cb15-6"' :
                                        'id="xs-injectables-links-module-AppModule-a036bcf441a879b234f3695ba69b5f6ebf0cfff8fa97a74221ff43f8a4c2081afb2a8274b121f526271bf8464c7affd22f2460718bff64ddb231150558d9cb15-6"' }>
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
                                            'data-bs-target="#controllers-links-module-AuthModule-0e737c7331747dcd1d4d14af428e6ef7c90bd005cb5259525a8b1f6f234ba5479fedede93fab235a8b14d188e35ae039372dae71f2474e733216a3f92434a151"' : 'data-bs-target="#xs-controllers-links-module-AuthModule-0e737c7331747dcd1d4d14af428e6ef7c90bd005cb5259525a8b1f6f234ba5479fedede93fab235a8b14d188e35ae039372dae71f2474e733216a3f92434a151"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AuthModule-0e737c7331747dcd1d4d14af428e6ef7c90bd005cb5259525a8b1f6f234ba5479fedede93fab235a8b14d188e35ae039372dae71f2474e733216a3f92434a151"' :
                                            'id="xs-controllers-links-module-AuthModule-0e737c7331747dcd1d4d14af428e6ef7c90bd005cb5259525a8b1f6f234ba5479fedede93fab235a8b14d188e35ae039372dae71f2474e733216a3f92434a151"' }>
                                            <li class="link">
                                                <a href="controllers/AuthController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AuthModule-0e737c7331747dcd1d4d14af428e6ef7c90bd005cb5259525a8b1f6f234ba5479fedede93fab235a8b14d188e35ae039372dae71f2474e733216a3f92434a151"' : 'data-bs-target="#xs-injectables-links-module-AuthModule-0e737c7331747dcd1d4d14af428e6ef7c90bd005cb5259525a8b1f6f234ba5479fedede93fab235a8b14d188e35ae039372dae71f2474e733216a3f92434a151"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AuthModule-0e737c7331747dcd1d4d14af428e6ef7c90bd005cb5259525a8b1f6f234ba5479fedede93fab235a8b14d188e35ae039372dae71f2474e733216a3f92434a151"' :
                                        'id="xs-injectables-links-module-AuthModule-0e737c7331747dcd1d4d14af428e6ef7c90bd005cb5259525a8b1f6f234ba5479fedede93fab235a8b14d188e35ae039372dae71f2474e733216a3f92434a151"' }>
                                        <li class="link">
                                            <a href="injectables/JwtStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >JwtStrategy</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AuthModule.html" data-type="entity-link" >AuthModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AuthModule-3a0e543b13582514cc68a8af86430f2820c60071ac73b1b4d0ae7a9d3bcf2924c4dc9da2bc0e1bd193755fe2b37a6aa3ceb525734595977aae5d8289740a5274-1"' : 'data-bs-target="#xs-controllers-links-module-AuthModule-3a0e543b13582514cc68a8af86430f2820c60071ac73b1b4d0ae7a9d3bcf2924c4dc9da2bc0e1bd193755fe2b37a6aa3ceb525734595977aae5d8289740a5274-1"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AuthModule-3a0e543b13582514cc68a8af86430f2820c60071ac73b1b4d0ae7a9d3bcf2924c4dc9da2bc0e1bd193755fe2b37a6aa3ceb525734595977aae5d8289740a5274-1"' :
                                            'id="xs-controllers-links-module-AuthModule-3a0e543b13582514cc68a8af86430f2820c60071ac73b1b4d0ae7a9d3bcf2924c4dc9da2bc0e1bd193755fe2b37a6aa3ceb525734595977aae5d8289740a5274-1"' }>
                                            <li class="link">
                                                <a href="controllers/AuthController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AuthModule-3a0e543b13582514cc68a8af86430f2820c60071ac73b1b4d0ae7a9d3bcf2924c4dc9da2bc0e1bd193755fe2b37a6aa3ceb525734595977aae5d8289740a5274-1"' : 'data-bs-target="#xs-injectables-links-module-AuthModule-3a0e543b13582514cc68a8af86430f2820c60071ac73b1b4d0ae7a9d3bcf2924c4dc9da2bc0e1bd193755fe2b37a6aa3ceb525734595977aae5d8289740a5274-1"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AuthModule-3a0e543b13582514cc68a8af86430f2820c60071ac73b1b4d0ae7a9d3bcf2924c4dc9da2bc0e1bd193755fe2b37a6aa3ceb525734595977aae5d8289740a5274-1"' :
                                        'id="xs-injectables-links-module-AuthModule-3a0e543b13582514cc68a8af86430f2820c60071ac73b1b4d0ae7a9d3bcf2924c4dc9da2bc0e1bd193755fe2b37a6aa3ceb525734595977aae5d8289740a5274-1"' }>
                                        <li class="link">
                                            <a href="injectables/AuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/DatabaseModule.html" data-type="entity-link" >DatabaseModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/DatasetModule.html" data-type="entity-link" >DatasetModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-DatasetModule-7b48b9520d639f2b92bb5d6b807880b3603e2f1a1fd0365c1997928c56e62369c17b2b38ac3be206c92bcaa96b62be7355d084eb7fc5917247c86cfe000c471e"' : 'data-bs-target="#xs-controllers-links-module-DatasetModule-7b48b9520d639f2b92bb5d6b807880b3603e2f1a1fd0365c1997928c56e62369c17b2b38ac3be206c92bcaa96b62be7355d084eb7fc5917247c86cfe000c471e"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-DatasetModule-7b48b9520d639f2b92bb5d6b807880b3603e2f1a1fd0365c1997928c56e62369c17b2b38ac3be206c92bcaa96b62be7355d084eb7fc5917247c86cfe000c471e"' :
                                            'id="xs-controllers-links-module-DatasetModule-7b48b9520d639f2b92bb5d6b807880b3603e2f1a1fd0365c1997928c56e62369c17b2b38ac3be206c92bcaa96b62be7355d084eb7fc5917247c86cfe000c471e"' }>
                                            <li class="link">
                                                <a href="controllers/DatasetController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DatasetController</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/DatasetModule.html" data-type="entity-link" >DatasetModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-DatasetModule-2b473924718e81fe9303a628b8305dc668d179ffd8ba10d14ef72d3172ed11ecbb06a306af54c82dfffc20c4f2919e50d48cc568d9778e265c4ab46f7aa175b6-1"' : 'data-bs-target="#xs-controllers-links-module-DatasetModule-2b473924718e81fe9303a628b8305dc668d179ffd8ba10d14ef72d3172ed11ecbb06a306af54c82dfffc20c4f2919e50d48cc568d9778e265c4ab46f7aa175b6-1"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-DatasetModule-2b473924718e81fe9303a628b8305dc668d179ffd8ba10d14ef72d3172ed11ecbb06a306af54c82dfffc20c4f2919e50d48cc568d9778e265c4ab46f7aa175b6-1"' :
                                            'id="xs-controllers-links-module-DatasetModule-2b473924718e81fe9303a628b8305dc668d179ffd8ba10d14ef72d3172ed11ecbb06a306af54c82dfffc20c4f2919e50d48cc568d9778e265c4ab46f7aa175b6-1"' }>
                                            <li class="link">
                                                <a href="controllers/DatasetController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DatasetController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-DatasetModule-2b473924718e81fe9303a628b8305dc668d179ffd8ba10d14ef72d3172ed11ecbb06a306af54c82dfffc20c4f2919e50d48cc568d9778e265c4ab46f7aa175b6-1"' : 'data-bs-target="#xs-injectables-links-module-DatasetModule-2b473924718e81fe9303a628b8305dc668d179ffd8ba10d14ef72d3172ed11ecbb06a306af54c82dfffc20c4f2919e50d48cc568d9778e265c4ab46f7aa175b6-1"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-DatasetModule-2b473924718e81fe9303a628b8305dc668d179ffd8ba10d14ef72d3172ed11ecbb06a306af54c82dfffc20c4f2919e50d48cc568d9778e265c4ab46f7aa175b6-1"' :
                                        'id="xs-injectables-links-module-DatasetModule-2b473924718e81fe9303a628b8305dc668d179ffd8ba10d14ef72d3172ed11ecbb06a306af54c82dfffc20c4f2919e50d48cc568d9778e265c4ab46f7aa175b6-1"' }>
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
                                            'data-bs-target="#controllers-links-module-DiagnosisModule-2fc391b2c206706370724b021e56839259d85007588e80e5af8dc4f6f9f3f5dc4101d0a09a4bddb9c825a97a153f68318afd11e39ee3c6720219592ac632c259"' : 'data-bs-target="#xs-controllers-links-module-DiagnosisModule-2fc391b2c206706370724b021e56839259d85007588e80e5af8dc4f6f9f3f5dc4101d0a09a4bddb9c825a97a153f68318afd11e39ee3c6720219592ac632c259"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-DiagnosisModule-2fc391b2c206706370724b021e56839259d85007588e80e5af8dc4f6f9f3f5dc4101d0a09a4bddb9c825a97a153f68318afd11e39ee3c6720219592ac632c259"' :
                                            'id="xs-controllers-links-module-DiagnosisModule-2fc391b2c206706370724b021e56839259d85007588e80e5af8dc4f6f9f3f5dc4101d0a09a4bddb9c825a97a153f68318afd11e39ee3c6720219592ac632c259"' }>
                                            <li class="link">
                                                <a href="controllers/DiagnosisController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DiagnosisController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-DiagnosisModule-2fc391b2c206706370724b021e56839259d85007588e80e5af8dc4f6f9f3f5dc4101d0a09a4bddb9c825a97a153f68318afd11e39ee3c6720219592ac632c259"' : 'data-bs-target="#xs-injectables-links-module-DiagnosisModule-2fc391b2c206706370724b021e56839259d85007588e80e5af8dc4f6f9f3f5dc4101d0a09a4bddb9c825a97a153f68318afd11e39ee3c6720219592ac632c259"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-DiagnosisModule-2fc391b2c206706370724b021e56839259d85007588e80e5af8dc4f6f9f3f5dc4101d0a09a4bddb9c825a97a153f68318afd11e39ee3c6720219592ac632c259"' :
                                        'id="xs-injectables-links-module-DiagnosisModule-2fc391b2c206706370724b021e56839259d85007588e80e5af8dc4f6f9f3f5dc4101d0a09a4bddb9c825a97a153f68318afd11e39ee3c6720219592ac632c259"' }>
                                        <li class="link">
                                            <a href="injectables/DiagnosisService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DiagnosisService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/DiagnosisModule.html" data-type="entity-link" >DiagnosisModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-DiagnosisModule-23c3c774dbae78761dbd435b4cce618f80dca4c205fbed7207f4d8136a2a4e0f05e8547a07490109483d7189076dfb37c21c9f4ecfe025004c83a93d3456428d-1"' : 'data-bs-target="#xs-controllers-links-module-DiagnosisModule-23c3c774dbae78761dbd435b4cce618f80dca4c205fbed7207f4d8136a2a4e0f05e8547a07490109483d7189076dfb37c21c9f4ecfe025004c83a93d3456428d-1"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-DiagnosisModule-23c3c774dbae78761dbd435b4cce618f80dca4c205fbed7207f4d8136a2a4e0f05e8547a07490109483d7189076dfb37c21c9f4ecfe025004c83a93d3456428d-1"' :
                                            'id="xs-controllers-links-module-DiagnosisModule-23c3c774dbae78761dbd435b4cce618f80dca4c205fbed7207f4d8136a2a4e0f05e8547a07490109483d7189076dfb37c21c9f4ecfe025004c83a93d3456428d-1"' }>
                                            <li class="link">
                                                <a href="controllers/DiagnosisController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DiagnosisController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-DiagnosisModule-23c3c774dbae78761dbd435b4cce618f80dca4c205fbed7207f4d8136a2a4e0f05e8547a07490109483d7189076dfb37c21c9f4ecfe025004c83a93d3456428d-1"' : 'data-bs-target="#xs-injectables-links-module-DiagnosisModule-23c3c774dbae78761dbd435b4cce618f80dca4c205fbed7207f4d8136a2a4e0f05e8547a07490109483d7189076dfb37c21c9f4ecfe025004c83a93d3456428d-1"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-DiagnosisModule-23c3c774dbae78761dbd435b4cce618f80dca4c205fbed7207f4d8136a2a4e0f05e8547a07490109483d7189076dfb37c21c9f4ecfe025004c83a93d3456428d-1"' :
                                        'id="xs-injectables-links-module-DiagnosisModule-23c3c774dbae78761dbd435b4cce618f80dca4c205fbed7207f4d8136a2a4e0f05e8547a07490109483d7189076dfb37c21c9f4ecfe025004c83a93d3456428d-1"' }>
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
                                            'data-bs-target="#controllers-links-module-FileModule-1c4d04164b5bbfd2420d46e9c86c565543cea1779771c078b54434d1dbfe57b87b41f8e60faf6b955e291646c01dd2e041afd7c0364e11e735756d14ae0a5c1e"' : 'data-bs-target="#xs-controllers-links-module-FileModule-1c4d04164b5bbfd2420d46e9c86c565543cea1779771c078b54434d1dbfe57b87b41f8e60faf6b955e291646c01dd2e041afd7c0364e11e735756d14ae0a5c1e"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-FileModule-1c4d04164b5bbfd2420d46e9c86c565543cea1779771c078b54434d1dbfe57b87b41f8e60faf6b955e291646c01dd2e041afd7c0364e11e735756d14ae0a5c1e"' :
                                            'id="xs-controllers-links-module-FileModule-1c4d04164b5bbfd2420d46e9c86c565543cea1779771c078b54434d1dbfe57b87b41f8e60faf6b955e291646c01dd2e041afd7c0364e11e735756d14ae0a5c1e"' }>
                                            <li class="link">
                                                <a href="controllers/FileController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FileController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-FileModule-1c4d04164b5bbfd2420d46e9c86c565543cea1779771c078b54434d1dbfe57b87b41f8e60faf6b955e291646c01dd2e041afd7c0364e11e735756d14ae0a5c1e"' : 'data-bs-target="#xs-injectables-links-module-FileModule-1c4d04164b5bbfd2420d46e9c86c565543cea1779771c078b54434d1dbfe57b87b41f8e60faf6b955e291646c01dd2e041afd7c0364e11e735756d14ae0a5c1e"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-FileModule-1c4d04164b5bbfd2420d46e9c86c565543cea1779771c078b54434d1dbfe57b87b41f8e60faf6b955e291646c01dd2e041afd7c0364e11e735756d14ae0a5c1e"' :
                                        'id="xs-injectables-links-module-FileModule-1c4d04164b5bbfd2420d46e9c86c565543cea1779771c078b54434d1dbfe57b87b41f8e60faf6b955e291646c01dd2e041afd7c0364e11e735756d14ae0a5c1e"' }>
                                        <li class="link">
                                            <a href="injectables/FileOperationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FileOperationService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/FileModule.html" data-type="entity-link" >FileModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-FileModule-4675fe1bcadbd9db4a86ed4186a9c1e4123c20f7f2bddb4902a7d434f47f23fc55a1259b79d6712893176d3497cb50c9b498563323418482b1a44579999e2416-1"' : 'data-bs-target="#xs-controllers-links-module-FileModule-4675fe1bcadbd9db4a86ed4186a9c1e4123c20f7f2bddb4902a7d434f47f23fc55a1259b79d6712893176d3497cb50c9b498563323418482b1a44579999e2416-1"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-FileModule-4675fe1bcadbd9db4a86ed4186a9c1e4123c20f7f2bddb4902a7d434f47f23fc55a1259b79d6712893176d3497cb50c9b498563323418482b1a44579999e2416-1"' :
                                            'id="xs-controllers-links-module-FileModule-4675fe1bcadbd9db4a86ed4186a9c1e4123c20f7f2bddb4902a7d434f47f23fc55a1259b79d6712893176d3497cb50c9b498563323418482b1a44579999e2416-1"' }>
                                            <li class="link">
                                                <a href="controllers/FileController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FileController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-FileModule-4675fe1bcadbd9db4a86ed4186a9c1e4123c20f7f2bddb4902a7d434f47f23fc55a1259b79d6712893176d3497cb50c9b498563323418482b1a44579999e2416-1"' : 'data-bs-target="#xs-injectables-links-module-FileModule-4675fe1bcadbd9db4a86ed4186a9c1e4123c20f7f2bddb4902a7d434f47f23fc55a1259b79d6712893176d3497cb50c9b498563323418482b1a44579999e2416-1"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-FileModule-4675fe1bcadbd9db4a86ed4186a9c1e4123c20f7f2bddb4902a7d434f47f23fc55a1259b79d6712893176d3497cb50c9b498563323418482b1a44579999e2416-1"' :
                                        'id="xs-injectables-links-module-FileModule-4675fe1bcadbd9db4a86ed4186a9c1e4123c20f7f2bddb4902a7d434f47f23fc55a1259b79d6712893176d3497cb50c9b498563323418482b1a44579999e2416-1"' }>
                                        <li class="link">
                                            <a href="injectables/FileService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FileService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/FileOperationModule.html" data-type="entity-link" >FileOperationModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-FileOperationModule-502ad3bb5872f443aed91cea3ac4bc23599073ecbf37bbb01cf93973fcfdafc19665448b2427c00e803c965817f231ee49b161be4880668ceb395bb4cebd55a4"' : 'data-bs-target="#xs-injectables-links-module-FileOperationModule-502ad3bb5872f443aed91cea3ac4bc23599073ecbf37bbb01cf93973fcfdafc19665448b2427c00e803c965817f231ee49b161be4880668ceb395bb4cebd55a4"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-FileOperationModule-502ad3bb5872f443aed91cea3ac4bc23599073ecbf37bbb01cf93973fcfdafc19665448b2427c00e803c965817f231ee49b161be4880668ceb395bb4cebd55a4"' :
                                        'id="xs-injectables-links-module-FileOperationModule-502ad3bb5872f443aed91cea3ac4bc23599073ecbf37bbb01cf93973fcfdafc19665448b2427c00e803c965817f231ee49b161be4880668ceb395bb4cebd55a4"' }>
                                        <li class="link">
                                            <a href="injectables/FileOperationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FileOperationService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/KnowledgeModule.html" data-type="entity-link" >KnowledgeModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-KnowledgeModule-86efc6c18aee4294e732e198456b14d7d0fce3075502add661802352fb566ab1270b065a30505b0f24387f2bf8f41b40db20c64a2bccddb5c2a4adac1d782951"' : 'data-bs-target="#xs-controllers-links-module-KnowledgeModule-86efc6c18aee4294e732e198456b14d7d0fce3075502add661802352fb566ab1270b065a30505b0f24387f2bf8f41b40db20c64a2bccddb5c2a4adac1d782951"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-KnowledgeModule-86efc6c18aee4294e732e198456b14d7d0fce3075502add661802352fb566ab1270b065a30505b0f24387f2bf8f41b40db20c64a2bccddb5c2a4adac1d782951"' :
                                            'id="xs-controllers-links-module-KnowledgeModule-86efc6c18aee4294e732e198456b14d7d0fce3075502add661802352fb566ab1270b065a30505b0f24387f2bf8f41b40db20c64a2bccddb5c2a4adac1d782951"' }>
                                            <li class="link">
                                                <a href="controllers/KnowledgeController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >KnowledgeController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-KnowledgeModule-86efc6c18aee4294e732e198456b14d7d0fce3075502add661802352fb566ab1270b065a30505b0f24387f2bf8f41b40db20c64a2bccddb5c2a4adac1d782951"' : 'data-bs-target="#xs-injectables-links-module-KnowledgeModule-86efc6c18aee4294e732e198456b14d7d0fce3075502add661802352fb566ab1270b065a30505b0f24387f2bf8f41b40db20c64a2bccddb5c2a4adac1d782951"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-KnowledgeModule-86efc6c18aee4294e732e198456b14d7d0fce3075502add661802352fb566ab1270b065a30505b0f24387f2bf8f41b40db20c64a2bccddb5c2a4adac1d782951"' :
                                        'id="xs-injectables-links-module-KnowledgeModule-86efc6c18aee4294e732e198456b14d7d0fce3075502add661802352fb566ab1270b065a30505b0f24387f2bf8f41b40db20c64a2bccddb5c2a4adac1d782951"' }>
                                        <li class="link">
                                            <a href="injectables/KnowledgeService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >KnowledgeService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/MailModule.html" data-type="entity-link" >MailModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-MailModule-6ecfcdd2403c0937b98b682e46e18956cf662b99cc7437e40086ad705382fb55baa9ccf894643632c2e071a086b8a48d9e35a6ef9a8f4920bb7a603a3ea1fc34"' : 'data-bs-target="#xs-injectables-links-module-MailModule-6ecfcdd2403c0937b98b682e46e18956cf662b99cc7437e40086ad705382fb55baa9ccf894643632c2e071a086b8a48d9e35a6ef9a8f4920bb7a603a3ea1fc34"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-MailModule-6ecfcdd2403c0937b98b682e46e18956cf662b99cc7437e40086ad705382fb55baa9ccf894643632c2e071a086b8a48d9e35a6ef9a8f4920bb7a603a3ea1fc34"' :
                                        'id="xs-injectables-links-module-MailModule-6ecfcdd2403c0937b98b682e46e18956cf662b99cc7437e40086ad705382fb55baa9ccf894643632c2e071a086b8a48d9e35a6ef9a8f4920bb7a603a3ea1fc34"' }>
                                        <li class="link">
                                            <a href="injectables/MailService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MailService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/MenuModule.html" data-type="entity-link" >MenuModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-MenuModule-86145c6c4aecf99cf00d047e9201fce36469c4ca177824abb2cb5a6c919f8e9775a63e4ddfe8d9adb9e4da60323a908633d2928fc6e09e7637da8a53e6217d9a"' : 'data-bs-target="#xs-controllers-links-module-MenuModule-86145c6c4aecf99cf00d047e9201fce36469c4ca177824abb2cb5a6c919f8e9775a63e4ddfe8d9adb9e4da60323a908633d2928fc6e09e7637da8a53e6217d9a"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-MenuModule-86145c6c4aecf99cf00d047e9201fce36469c4ca177824abb2cb5a6c919f8e9775a63e4ddfe8d9adb9e4da60323a908633d2928fc6e09e7637da8a53e6217d9a"' :
                                            'id="xs-controllers-links-module-MenuModule-86145c6c4aecf99cf00d047e9201fce36469c4ca177824abb2cb5a6c919f8e9775a63e4ddfe8d9adb9e4da60323a908633d2928fc6e09e7637da8a53e6217d9a"' }>
                                            <li class="link">
                                                <a href="controllers/MenuController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuController</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/MenuModule.html" data-type="entity-link" >MenuModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-MenuModule-486a7ff7261a620b02c62b442590272a2f8f013456ff1f6592f4bb140fd72b099d857afb84303cd0f14312dec762fc0cae297c8a985263cfdf7eedd8a398ef4f-1"' : 'data-bs-target="#xs-controllers-links-module-MenuModule-486a7ff7261a620b02c62b442590272a2f8f013456ff1f6592f4bb140fd72b099d857afb84303cd0f14312dec762fc0cae297c8a985263cfdf7eedd8a398ef4f-1"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-MenuModule-486a7ff7261a620b02c62b442590272a2f8f013456ff1f6592f4bb140fd72b099d857afb84303cd0f14312dec762fc0cae297c8a985263cfdf7eedd8a398ef4f-1"' :
                                            'id="xs-controllers-links-module-MenuModule-486a7ff7261a620b02c62b442590272a2f8f013456ff1f6592f4bb140fd72b099d857afb84303cd0f14312dec762fc0cae297c8a985263cfdf7eedd8a398ef4f-1"' }>
                                            <li class="link">
                                                <a href="controllers/MenuController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-MenuModule-486a7ff7261a620b02c62b442590272a2f8f013456ff1f6592f4bb140fd72b099d857afb84303cd0f14312dec762fc0cae297c8a985263cfdf7eedd8a398ef4f-1"' : 'data-bs-target="#xs-injectables-links-module-MenuModule-486a7ff7261a620b02c62b442590272a2f8f013456ff1f6592f4bb140fd72b099d857afb84303cd0f14312dec762fc0cae297c8a985263cfdf7eedd8a398ef4f-1"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-MenuModule-486a7ff7261a620b02c62b442590272a2f8f013456ff1f6592f4bb140fd72b099d857afb84303cd0f14312dec762fc0cae297c8a985263cfdf7eedd8a398ef4f-1"' :
                                        'id="xs-injectables-links-module-MenuModule-486a7ff7261a620b02c62b442590272a2f8f013456ff1f6592f4bb140fd72b099d857afb84303cd0f14312dec762fc0cae297c8a985263cfdf7eedd8a398ef4f-1"' }>
                                        <li class="link">
                                            <a href="injectables/MenuService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/PlantModule.html" data-type="entity-link" >PlantModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-PlantModule-56450a5bb981334da921aecf83f32c673b2bac1244b36dae8438bc17c9b618e53a6c19c6a262854f0d14b4fbbaa73c5b715f92b4170bf06270172782cfd1221a"' : 'data-bs-target="#xs-controllers-links-module-PlantModule-56450a5bb981334da921aecf83f32c673b2bac1244b36dae8438bc17c9b618e53a6c19c6a262854f0d14b4fbbaa73c5b715f92b4170bf06270172782cfd1221a"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-PlantModule-56450a5bb981334da921aecf83f32c673b2bac1244b36dae8438bc17c9b618e53a6c19c6a262854f0d14b4fbbaa73c5b715f92b4170bf06270172782cfd1221a"' :
                                            'id="xs-controllers-links-module-PlantModule-56450a5bb981334da921aecf83f32c673b2bac1244b36dae8438bc17c9b618e53a6c19c6a262854f0d14b4fbbaa73c5b715f92b4170bf06270172782cfd1221a"' }>
                                            <li class="link">
                                                <a href="controllers/PlantController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PlantController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-PlantModule-56450a5bb981334da921aecf83f32c673b2bac1244b36dae8438bc17c9b618e53a6c19c6a262854f0d14b4fbbaa73c5b715f92b4170bf06270172782cfd1221a"' : 'data-bs-target="#xs-injectables-links-module-PlantModule-56450a5bb981334da921aecf83f32c673b2bac1244b36dae8438bc17c9b618e53a6c19c6a262854f0d14b4fbbaa73c5b715f92b4170bf06270172782cfd1221a"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-PlantModule-56450a5bb981334da921aecf83f32c673b2bac1244b36dae8438bc17c9b618e53a6c19c6a262854f0d14b4fbbaa73c5b715f92b4170bf06270172782cfd1221a"' :
                                        'id="xs-injectables-links-module-PlantModule-56450a5bb981334da921aecf83f32c673b2bac1244b36dae8438bc17c9b618e53a6c19c6a262854f0d14b4fbbaa73c5b715f92b4170bf06270172782cfd1221a"' }>
                                        <li class="link">
                                            <a href="injectables/PlantService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PlantService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/RedisModule.html" data-type="entity-link" >RedisModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-RedisModule-456aeda86853d9460aad4aae52def79a00d038b161cdebb2cfb837ca8baf6dd68d14e08e2e01ae0c9f1ef110153aecc6100344defa779e1ba072c11ef72885f8"' : 'data-bs-target="#xs-injectables-links-module-RedisModule-456aeda86853d9460aad4aae52def79a00d038b161cdebb2cfb837ca8baf6dd68d14e08e2e01ae0c9f1ef110153aecc6100344defa779e1ba072c11ef72885f8"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-RedisModule-456aeda86853d9460aad4aae52def79a00d038b161cdebb2cfb837ca8baf6dd68d14e08e2e01ae0c9f1ef110153aecc6100344defa779e1ba072c11ef72885f8"' :
                                        'id="xs-injectables-links-module-RedisModule-456aeda86853d9460aad4aae52def79a00d038b161cdebb2cfb837ca8baf6dd68d14e08e2e01ae0c9f1ef110153aecc6100344defa779e1ba072c11ef72885f8"' }>
                                        <li class="link">
                                            <a href="injectables/RedisService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RedisService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/RoleModule.html" data-type="entity-link" >RoleModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-RoleModule-0a622e95cd6216353780bff0e746bf4b9b4a030715efe914b582712ccca3a0407af18062c1be2ec9a6f94aed2a4c9b8518e885b1135a007071388cadbc2be56c"' : 'data-bs-target="#xs-controllers-links-module-RoleModule-0a622e95cd6216353780bff0e746bf4b9b4a030715efe914b582712ccca3a0407af18062c1be2ec9a6f94aed2a4c9b8518e885b1135a007071388cadbc2be56c"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-RoleModule-0a622e95cd6216353780bff0e746bf4b9b4a030715efe914b582712ccca3a0407af18062c1be2ec9a6f94aed2a4c9b8518e885b1135a007071388cadbc2be56c"' :
                                            'id="xs-controllers-links-module-RoleModule-0a622e95cd6216353780bff0e746bf4b9b4a030715efe914b582712ccca3a0407af18062c1be2ec9a6f94aed2a4c9b8518e885b1135a007071388cadbc2be56c"' }>
                                            <li class="link">
                                                <a href="controllers/RoleController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RoleController</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/RoleModule.html" data-type="entity-link" >RoleModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-RoleModule-dcda0c68793a259c7fe70faf90c5a37c393dafd39ede67b972e2246799ef0473290447f3553f7ddee8de489d7e99c7f1cc606b84c67f59cd244835fec85f100f-1"' : 'data-bs-target="#xs-controllers-links-module-RoleModule-dcda0c68793a259c7fe70faf90c5a37c393dafd39ede67b972e2246799ef0473290447f3553f7ddee8de489d7e99c7f1cc606b84c67f59cd244835fec85f100f-1"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-RoleModule-dcda0c68793a259c7fe70faf90c5a37c393dafd39ede67b972e2246799ef0473290447f3553f7ddee8de489d7e99c7f1cc606b84c67f59cd244835fec85f100f-1"' :
                                            'id="xs-controllers-links-module-RoleModule-dcda0c68793a259c7fe70faf90c5a37c393dafd39ede67b972e2246799ef0473290447f3553f7ddee8de489d7e99c7f1cc606b84c67f59cd244835fec85f100f-1"' }>
                                            <li class="link">
                                                <a href="controllers/RoleController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RoleController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-RoleModule-dcda0c68793a259c7fe70faf90c5a37c393dafd39ede67b972e2246799ef0473290447f3553f7ddee8de489d7e99c7f1cc606b84c67f59cd244835fec85f100f-1"' : 'data-bs-target="#xs-injectables-links-module-RoleModule-dcda0c68793a259c7fe70faf90c5a37c393dafd39ede67b972e2246799ef0473290447f3553f7ddee8de489d7e99c7f1cc606b84c67f59cd244835fec85f100f-1"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-RoleModule-dcda0c68793a259c7fe70faf90c5a37c393dafd39ede67b972e2246799ef0473290447f3553f7ddee8de489d7e99c7f1cc606b84c67f59cd244835fec85f100f-1"' :
                                        'id="xs-injectables-links-module-RoleModule-dcda0c68793a259c7fe70faf90c5a37c393dafd39ede67b972e2246799ef0473290447f3553f7ddee8de489d7e99c7f1cc606b84c67f59cd244835fec85f100f-1"' }>
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
                                            'data-bs-target="#controllers-links-module-UserModule-a1fdf89bcd2d970415fe8a4b8a11e8e32b2faf3182ff5b128bc44773860defd72b466f3deb8a7731c21ca415869c4d76bf65c1f8feafbdfe30551c4474c9d673"' : 'data-bs-target="#xs-controllers-links-module-UserModule-a1fdf89bcd2d970415fe8a4b8a11e8e32b2faf3182ff5b128bc44773860defd72b466f3deb8a7731c21ca415869c4d76bf65c1f8feafbdfe30551c4474c9d673"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-UserModule-a1fdf89bcd2d970415fe8a4b8a11e8e32b2faf3182ff5b128bc44773860defd72b466f3deb8a7731c21ca415869c4d76bf65c1f8feafbdfe30551c4474c9d673"' :
                                            'id="xs-controllers-links-module-UserModule-a1fdf89bcd2d970415fe8a4b8a11e8e32b2faf3182ff5b128bc44773860defd72b466f3deb8a7731c21ca415869c4d76bf65c1f8feafbdfe30551c4474c9d673"' }>
                                            <li class="link">
                                                <a href="controllers/UserController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserController</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/UserModule.html" data-type="entity-link" >UserModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-UserModule-0ac652b27560821fc3138c9bc3b135a5f96465c966d2e376bf7b6e7bf4ccde260643d102bca23d0863fdb59d7a94ceadda65d354e13b46302fc8adb64e1736be-1"' : 'data-bs-target="#xs-controllers-links-module-UserModule-0ac652b27560821fc3138c9bc3b135a5f96465c966d2e376bf7b6e7bf4ccde260643d102bca23d0863fdb59d7a94ceadda65d354e13b46302fc8adb64e1736be-1"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-UserModule-0ac652b27560821fc3138c9bc3b135a5f96465c966d2e376bf7b6e7bf4ccde260643d102bca23d0863fdb59d7a94ceadda65d354e13b46302fc8adb64e1736be-1"' :
                                            'id="xs-controllers-links-module-UserModule-0ac652b27560821fc3138c9bc3b135a5f96465c966d2e376bf7b6e7bf4ccde260643d102bca23d0863fdb59d7a94ceadda65d354e13b46302fc8adb64e1736be-1"' }>
                                            <li class="link">
                                                <a href="controllers/UserController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-UserModule-0ac652b27560821fc3138c9bc3b135a5f96465c966d2e376bf7b6e7bf4ccde260643d102bca23d0863fdb59d7a94ceadda65d354e13b46302fc8adb64e1736be-1"' : 'data-bs-target="#xs-injectables-links-module-UserModule-0ac652b27560821fc3138c9bc3b135a5f96465c966d2e376bf7b6e7bf4ccde260643d102bca23d0863fdb59d7a94ceadda65d354e13b46302fc8adb64e1736be-1"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UserModule-0ac652b27560821fc3138c9bc3b135a5f96465c966d2e376bf7b6e7bf4ccde260643d102bca23d0863fdb59d7a94ceadda65d354e13b46302fc8adb64e1736be-1"' :
                                        'id="xs-injectables-links-module-UserModule-0ac652b27560821fc3138c9bc3b135a5f96465c966d2e376bf7b6e7bf4ccde260643d102bca23d0863fdb59d7a94ceadda65d354e13b46302fc8adb64e1736be-1"' }>
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
                                    <a href="controllers/AiModelController.html" data-type="entity-link" >AiModelController</a>
                                </li>
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
                                    <a href="controllers/AuthController-1.html" data-type="entity-link" >AuthController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/DatasetController.html" data-type="entity-link" >DatasetController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/DatasetController-1.html" data-type="entity-link" >DatasetController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/DiagnosisController.html" data-type="entity-link" >DiagnosisController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/DiagnosisController-1.html" data-type="entity-link" >DiagnosisController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/DownloadController.html" data-type="entity-link" >DownloadController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/FileController.html" data-type="entity-link" >FileController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/FileController-1.html" data-type="entity-link" >FileController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/KnowledgeController.html" data-type="entity-link" >KnowledgeController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/MenuController.html" data-type="entity-link" >MenuController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/MenuController-1.html" data-type="entity-link" >MenuController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/PlantController.html" data-type="entity-link" >PlantController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/RoleController.html" data-type="entity-link" >RoleController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/RoleController-1.html" data-type="entity-link" >RoleController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/UploadController.html" data-type="entity-link" >UploadController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/UserController.html" data-type="entity-link" >UserController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/UserController-1.html" data-type="entity-link" >UserController</a>
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
                                    <a href="entities/AIModel.html" data-type="entity-link" >AIModel</a>
                                </li>
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
                                    <a href="entities/DiagnosisHistory-1.html" data-type="entity-link" >DiagnosisHistory</a>
                                </li>
                                <li class="link">
                                    <a href="entities/File.html" data-type="entity-link" >File</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Menu.html" data-type="entity-link" >Menu</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Plant.html" data-type="entity-link" >Plant</a>
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
                                <a href="classes/BaseEntity.html" data-type="entity-link" >BaseEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/CompleteChunkDto.html" data-type="entity-link" >CompleteChunkDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ConfigDto.html" data-type="entity-link" >ConfigDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateAiConfigDto.html" data-type="entity-link" >CreateAiConfigDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateAiConfigsDto.html" data-type="entity-link" >CreateAiConfigsDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateAiModelDto.html" data-type="entity-link" >CreateAiModelDto</a>
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
                                <a href="classes/CreatePlantDto.html" data-type="entity-link" >CreatePlantDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateRoleDto.html" data-type="entity-link" >CreateRoleDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateRoleDto-1.html" data-type="entity-link" >CreateRoleDto</a>
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
                                <a href="classes/CreateUserDto-1.html" data-type="entity-link" >CreateUserDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CustomRpcExceptionFilter.html" data-type="entity-link" >CustomRpcExceptionFilter</a>
                            </li>
                            <li class="link">
                                <a href="classes/Dataset.html" data-type="entity-link" >Dataset</a>
                            </li>
                            <li class="link">
                                <a href="classes/DiagnosisHistory.html" data-type="entity-link" >DiagnosisHistory</a>
                            </li>
                            <li class="link">
                                <a href="classes/DiagnosisHistory-1.html" data-type="entity-link" >DiagnosisHistory</a>
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
                                <a href="classes/ImageRequest.html" data-type="entity-link" >ImageRequest</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginDto.html" data-type="entity-link" >LoginDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginDto-1.html" data-type="entity-link" >LoginDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/OtherExceptionsFilter.html" data-type="entity-link" >OtherExceptionsFilter</a>
                            </li>
                            <li class="link">
                                <a href="classes/PlantDiseaseKnowledge.html" data-type="entity-link" >PlantDiseaseKnowledge</a>
                            </li>
                            <li class="link">
                                <a href="classes/RegisterDto.html" data-type="entity-link" >RegisterDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/RegisterDto-1.html" data-type="entity-link" >RegisterDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ResetPasswordDto.html" data-type="entity-link" >ResetPasswordDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ResetPasswordDto-1.html" data-type="entity-link" >ResetPasswordDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/TaskCreateDto.html" data-type="entity-link" >TaskCreateDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/TypeormFilter.html" data-type="entity-link" >TypeormFilter</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateAiConfigDto.html" data-type="entity-link" >UpdateAiConfigDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateAiModelDto.html" data-type="entity-link" >UpdateAiModelDto</a>
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
                                <a href="classes/UpdatePasswordDto-1.html" data-type="entity-link" >UpdatePasswordDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdatePlantDiseaseKnowledgeDto.html" data-type="entity-link" >UpdatePlantDiseaseKnowledgeDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdatePlantDto.html" data-type="entity-link" >UpdatePlantDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateProfileDto.html" data-type="entity-link" >UpdateProfileDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateProfileDto-1.html" data-type="entity-link" >UpdateProfileDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateRoleDto.html" data-type="entity-link" >UpdateRoleDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateRoleDto-1.html" data-type="entity-link" >UpdateRoleDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateUserDto.html" data-type="entity-link" >UpdateUserDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateUserDto-1.html" data-type="entity-link" >UpdateUserDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UploadChunkDto.html" data-type="entity-link" >UploadChunkDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UploadChunkDto-1.html" data-type="entity-link" >UploadChunkDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UploadPreloadDto.html" data-type="entity-link" >UploadPreloadDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UploadSingleDto.html" data-type="entity-link" >UploadSingleDto</a>
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
                                    <a href="injectables/AiConfigsService.html" data-type="entity-link" >AiConfigsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AiModelService.html" data-type="entity-link" >AiModelService</a>
                                </li>
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
                                    <a href="injectables/DatabaseService.html" data-type="entity-link" >DatabaseService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DatasetService.html" data-type="entity-link" >DatasetService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DiagnosisService.html" data-type="entity-link" >DiagnosisService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DiagnosisService-1.html" data-type="entity-link" >DiagnosisService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DownloadService.html" data-type="entity-link" >DownloadService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FileOperationService.html" data-type="entity-link" >FileOperationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FileOperationService-1.html" data-type="entity-link" >FileOperationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FileService.html" data-type="entity-link" >FileService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FileSizeValidationPipe.html" data-type="entity-link" >FileSizeValidationPipe</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FileTypeValidationPipe.html" data-type="entity-link" >FileTypeValidationPipe</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/JwtStrategy.html" data-type="entity-link" >JwtStrategy</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/KnowledgeService.html" data-type="entity-link" >KnowledgeService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MailService.html" data-type="entity-link" >MailService</a>
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
                                    <a href="injectables/PlantService.html" data-type="entity-link" >PlantService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RedisService.html" data-type="entity-link" >RedisService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RoleService.html" data-type="entity-link" >RoleService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UploadService.html" data-type="entity-link" >UploadService</a>
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
                                <a href="interfaces/DownloadService.html" data-type="entity-link" >DownloadService</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Request.html" data-type="entity-link" >Request</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Request-1.html" data-type="entity-link" >Request</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Request-2.html" data-type="entity-link" >Request</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserPayload.html" data-type="entity-link" >UserPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserQuery.html" data-type="entity-link" >UserQuery</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserQuery-1.html" data-type="entity-link" >UserQuery</a>
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