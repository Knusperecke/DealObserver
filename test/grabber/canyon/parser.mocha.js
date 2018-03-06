'use strict';

const Parser = require('../../../src/grabber/canyon/parser');
const assert = require('chai').assert;

describe('Canyon parser', () => {
    it('Expects an object with "type" and "data"', () => {
        assert.deepEqual(Parser({type: 'outlet', data: ''}), []);
    });

    it('Handles parsing type "outlet"', () => {
        assert.deepEqual(Parser({type: 'outlet', data: ''}), []);
    });

    it('Handles parsing type "normalOffer"', () => {
        assert.deepEqual(Parser({type: 'normalOffer', data: ''}), []);
    });

    it('Throws for unexpected parsing types', () => {
        assert.throws(Parser.bind(Parser, {type: 'UnknownSpecials', data: ''}), 'Received unexpected parsing job');
    });

    it('Returns an empty array for empty input', () => {
        assert.deepEqual(Parser({type: 'outlet', data: ''}), []);
    });

    it('Grabs an outlet item from the input', () => {
        const input = '{\n' +
            '            , "name": "MoxiSpeed CF 9.0"\n' +
            '                                        , "image": "/img/outlet/22677_img_res.png"\n' +
            '                                        , "sku": "000000000000111695"\n' +
            '                        , "brand": {\n' +
            '                "@type": "Brand"\n' +
            '                , "name": "Canyon"\n' +
            '            }\n' +
            '                                    , "offers": {\n' +
            '                "@type": "Offer"\n' +
            '                                    , "price": "2299"\n' +
            '                    , "priceCurrency": "EUR"\n' +
            '                                , "itemCondition": "http://schema.org/NewCondition"\n' +
            '                , "availability": "http://schema.org/InStock"             }\n' +
            '        }\n' +
            '        ... data-size="|XL|" ...\n' +
            '        ... data-year="2017" ...\n' +
            '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="MoxiSpeed CF SLX 9.0 LTD" class="img-responsive" width="1199" height="799" sizes="(min-width: 1202px) 599px, (min-width: 768px) 383px, 100vw" srcset="https://blub/62/6/56dfdff4841ee1c5a20c635b355cb.jpg 1199w, https://blub/f6/8/5caed2ec67f1ae27ea78e76e6df0f.jpg 767w, https://blub/d9/4/950ae18f813b15648ed8a4095bc2f.jpg 599w, https://blub/91/9/63a775e76c7e28537878056bc68a0.jpg 480w, https://blub/0f/2/e0af8e94f46bed7784dfc9c14e244.jpg 383w, https://blub/00/3/c35fded1512a127b75ecec7512b54.jpg 240w" style="opacity: 1;">';

        const expectedItem = {
            name: 'MoxiSpeed CF 9.0 2017',
            id: 'moxispeed cf 9.0 2017',
            price: 2299,
            offerId: '000000000000111695',
            size: '|XL|',
            modelYear: '2017',
            permanent: false,
            url: 'https://www.canyon.com/img/outlet/22677_img_res.png',
            smallImgUrl: 'https://blub/f6/8/5caed2ec67f1ae27ea78e76e6df0f.jpg',
            condition: 'NewCondition'
        };

        assert.deepEqual(Parser({type: 'outlet', data: input}), [expectedItem]);
    });

    it('Aborts for incomplete outlet data', () => {
        const input = '{\n' +
            '            , "name": "MoxiSpeed CF 9.0"\n' +
            '                                        , "image": "/img/outlet/22677_img_res.png"\n' +
            '                                        , "sku": "000000000000111695"\n' +
            '                        , "brand": {\n' +
            '                "@type": "Brand"\n' +
            '                , "name": "Canyon"';

        assert.throws(Parser.bind(Parser, {type: 'outlet', data: input}), 'Failed parsing outlet data');
    });

    describe('Grabs normal offers from input', () => {
        const inputNoSmallImg = '{\n' +
            '            "@context": "http://schema.org/"\n' +
            '            , "@type": "Product"\n' +
            '            , "name": "Thinair CF SLX Disc 9.0 LTD"\n' +
            '                                        , "image": "https://static.canyon.com/_img/bikes/2018/Thinair-cf-slx-disc-9-ltd_c1105.png"\n' +
            '                                        , "sku": "000000000000001810"\n' +
            '                        , "brand": {\n' +
            '                "@type": "Brand"\n' +
            '                , "name": "Canyon"\n' +
            '            }\n' +
            '                                    , "offers": {\n' +
            '                "@type": "Offer"\n' +
            '                                    , "price": "6899.00"\n' +
            '                    , "priceCurrency": "EUR"\n' +
            '                                , "itemCondition": "http://schema.org/NewCondition"\n' +
            '                , "availability": "http://schema.org/InStock"             }\n' +
            '        }\n';

        let input = inputNoSmallImg +
            '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="lastbike CF SLX Disc 9.0 Di2" class="img-responsive" width="1199" height="799" sizes="(min-width: 1202px) 599px, (min-width: 768px) 383px, 100vw" srcset="https://blub/75/5/307bfc1c636bdd639ed79f5013185.jpg 1199w, https://blub/d4/9/aa4f663dac3837dc54dafdc850467.jpg 767w, https://blub/80/a/0a21baa6d85d96e153fdedba7fc56.jpg 599w, https://blub/0d/b/800d6d729db7e6e3175f88a845af9.jpg 480w, https://blub/1a/e/f0a9c8667ee6f50a14a2c82c12a25.jpg 383w, https://blub/1a/1/fcab75e7326bc2ed51ad9203e830c.jpg 240w" style="opacity: 1;">\n';

        const expectedItem = {
            name: 'Thinair CF SLX Disc 9.0 LTD 2018',
            id: 'thinair cf slx disc 9.0 ltd 2018',
            price: 6899,
            offerId: '000000000000001810',
            size: '*',
            modelYear: '2018',
            permanent: true,
            url: 'https://static.canyon.com/_img/bikes/2018/Thinair-cf-slx-disc-9-ltd_c1105.png',
            smallImgUrl: 'https://blub/d4/9/aa4f663dac3837dc54dafdc850467.jpg',
            condition: 'NewCondition'
        };


        it('Grabs correct item', () => {
            assert.deepEqual(Parser({type: 'normalOffer', data: input}), [expectedItem]);
        });

        it('Is not confused by extra "small images" at the end', () => {
            input = input +
                '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="road teaser sportprogeometrie" class="img-responsive" width="1199" height="799" sizes="(min-width: 1202px) 599px, (min-width: 768px) 383px, 100vw" srcset="https://blub/c4/a/b8ebdef98a8c93edd80c7da7e9ecd.jpg 1199w, https://blub/df/d/02dd72b2831c776f8f84c68246e0a.jpg 767w, https://blub/1c/5/02aa3d9921b2b6df3a62e6d36579b.jpg 599w, https://blub/9f/6/db09ec659cf4c615fb1bde7977057.jpg 480w, https://blub/d0/8/9c0ad52147ef3c81ff2aa5ade2e47.jpg 383w, https://blub/37/7/e2599bfe3c3e1ff8a6524ec7aecaa.jpg 240w" style="opacity: 1;">\n' +
                '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="slideshow lastbike cf sl 3" class="img-responsive" width="1199" height="799" sizes="(min-width: 1202px) 1199px, (min-width: 768px) 767px, 100vw" srcset="https://blub/1d/a/ee9f580d5a7091a38e1bd94dedc16.jpg 1199w, https://blub/22/6/63a3a2d9ad7ae01de933acac57efa.jpg 767w, https://blub/44/8/00aa4f2e62f4c23f7c0d9aeb1f2be.jpg 480w, https://blub/1b/6/70ece7ce62877aadba464080769e1.jpg 240w" style="opacity: 1;">\n';
            assert.deepEqual(Parser({type: 'normalOffer', data: input}), [expectedItem]);
        });

        it('Is not confused by extra "small images" before the item', () => {
            input =
                '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="Other Awesome Bike CF" class="img-responsive" width="1199" height="799" sizes="(min-width: 1202px) 599px, (min-width: 768px) 383px, 100vw" srcset="https://blub/75/5/307bfc1c636bdd639ed79f5013185.jpg 1199w, https://blub/d4/9/aa4f663dac3837dc54dafdc850467.jpg 767w, https://blub/80/a/0a21baa6d85d96e153fdedba7fc56.jpg 599w, https://blub/0d/b/800d6d729db7e6e3175f88a845af9.jpg 480w, https://blub/1a/e/f0a9c8667ee6f50a14a2c82c12a25.jpg 383w, https://blub/1a/1/fcab75e7326bc2ed51ad9203e830c.jpg 240w" style="opacity: 1;">\n' +
                input;
            assert.deepEqual(Parser({type: 'normalOffer', data: input}), [expectedItem]);
        });

        it('Is not confused by extra "small images" before and after the item', () => {
            input =
                '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="Other Awesome Bike CF" class="img-responsive" width="1199" height="799" sizes="(min-width: 1202px) 599px, (min-width: 768px) 383px, 100vw" srcset="https://blub/75/5/307bfc1c636bdd639ed79f5013185.jpg 1199w, https://blub/d4/9/aa4f663dac3837dc54dafdc850467.jpg 767w, https://blub/80/a/0a21baa6d85d96e153fdedba7fc56.jpg 599w, https://blub/0d/b/800d6d729db7e6e3175f88a845af9.jpg 480w, https://blub/1a/e/f0a9c8667ee6f50a14a2c82c12a25.jpg 383w, https://blub/1a/1/fcab75e7326bc2ed51ad9203e830c.jpg 240w" style="opacity: 1;">\n' +
                input +
                '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="road teaser sportprogeometrie" class="img-responsive" width="1199" height="799" sizes="(min-width: 1202px) 599px, (min-width: 768px) 383px, 100vw" srcset="https://blub/c4/a/b8ebdef98a8c93edd80c7da7e9ecd.jpg 1199w, https://blub/df/d/02dd72b2831c776f8f84c68246e0a.jpg 767w, https://blub/1c/5/02aa3d9921b2b6df3a62e6d36579b.jpg 599w, https://blub/9f/6/db09ec659cf4c615fb1bde7977057.jpg 480w, https://blub/d0/8/9c0ad52147ef3c81ff2aa5ade2e47.jpg 383w, https://blub/37/7/e2599bfe3c3e1ff8a6524ec7aecaa.jpg 240w" style="opacity: 1;">\n' +
                '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="slideshow lastbike cf sl 3" class="img-responsive" width="1199" height="799" sizes="(min-width: 1202px) 1199px, (min-width: 768px) 767px, 100vw" srcset="https://blub/1d/a/ee9f580d5a7091a38e1bd94dedc16.jpg 1199w, https://blub/22/6/63a3a2d9ad7ae01de933acac57efa.jpg 767w, https://blub/44/8/00aa4f2e62f4c23f7c0d9aeb1f2be.jpg 480w, https://blub/1b/6/70ece7ce62877aadba464080769e1.jpg 240w" style="opacity: 1;">\n';
            assert.deepEqual(Parser({type: 'normalOffer', data: input}), [expectedItem]);
        });

        it('Is not confused by extra "small images" before and after the item', () => {
            assert.throws(
                Parser.bind(Parser, {type: 'normalOffer', data: inputNoSmallImg}),
                'Could not find small img in section');
        });
    });
});