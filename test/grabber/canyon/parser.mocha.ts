import { assert, expect } from 'chai';
import { parse } from '../../../src/grabber/canyon/parser.js';
import { exampleNormalItem } from './example-item.js';
import { exampleOutletInput } from './example-outlet.js';

describe('Canyon parser', () => {
    it('handles parsing type "outlet"', () => {
        assert.deepEqual(parse({ type: 'outlet', data: '' }), []);
    });

    it('handles parsing type "normalOffer"', () => {
        assert.deepEqual(parse({ type: 'normalOffer', data: '' }), []);
    });

    it('returns an empty array for empty input', () => {
        assert.deepEqual(parse({ type: 'outlet', data: '' }), []);
    });

    it('grabs an outlet item from the input', () => {
        const input = exampleOutletInput;

        const expectedItem = {
            name: 'Moxi Carbon Light Team Arkéo-team 2020',
            id: 'moxi carbon light team arkéo-team 2020',
            price: 1234,
            offerId: '50035731_0001079070',
            size: 'S',
            modelYear: '2020',
            permanent: false,
            url: 'https://www.canyon.com/en-de/cheap-category/pro-bikes/moxi-carbon-light-team%C2%A0/50035731.html',
            smallImgUrl:
                'https://www.some-website.com/dw/image/v2/BCML_PRD/on/demandware.static/-/Sites-manufacturer-master/default/dwbfab41f6/images/full/Full_50035/2022/Full_50035731_0001079070-p5.jpg?sw=630&amp;sh=355&amp;sm=fit&amp;sfrm=png&amp;q=90&amp;bgcolor=F2F2F2',
            condition: 'outlet',
        };

        assert.deepEqual(parse({ type: 'outlet', data: input }), [expectedItem]);
    });

    it('aborts for incomplete outlet data', () => {
        const input =
            '{\n' +
            '            , "name": "MoxiSpeed CF 9.0"\n' +
            '                                        , "image": "/img/outlet/22677_img_res.png"\n' +
            '                                        , "sku": "000000000000111695"\n' +
            '                        , "brand": {\n' +
            '                "@type": "Brand"\n' +
            '                , "name": "Canyon"';

        const parseResult = parse({ type: 'outlet', data: input });
        expect(parseResult.length).to.eq(0);
    });

    describe('grabs normal offers from input', () => {
        const expectedItem = {
            name: 'Thinair 9.0 LTD 2018 2023',
            id: 'thinair 9.0 ltd 2018 2023',
            price: 6499,
            offerId: '12345678',
            size: '*',
            modelYear: '2023',
            permanent: true,
            url: 'https://www.some-brand.com/images/full/full_2023_1234_pinacle-thin-air-18_P03_P5.jpg?sw=501&amp;sh=282&amp;sm=fit&amp;sfrm=png&amp;q=90&amp;bgcolor=F2F2F2',
            smallImgUrl:
                'https://www.some-brand.com/full_2023_1234_pinacle-thin-air-18_P03_P5.jpg?sw=630&amp;sh=355&amp;sm=fit&amp;sfrm=png&amp;q=90&amp;bgcolor=F2F2F2',
            condition: 'NewCondition',
        };

        it('grabs correct item', function () {
            const input = exampleNormalItem;
            assert.deepEqual(parse({ type: 'normalOffer', data: input }), [expectedItem]);
        });

        it('is not confused by extra "small images" at the end', () => {
            const input =
                exampleNormalItem +
                '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="road teaser sportprogeometrie" class="img-responsive" width="1199" height="799" sizes="(min-width: 1202px) 599px, (min-width: 768px) 383px, 100vw" srcset="https://blub/c4/a/b8ebdef98a8c93edd80c7da7e9ecd.jpg 1199w, https://blub/df/d/02dd72b2831c776f8f84c68246e0a.jpg 767w, https://blub/1c/5/02aa3d9921b2b6df3a62e6d36579b.jpg 599w, https://blub/9f/6/db09ec659cf4c615fb1bde7977057.jpg 480w, https://blub/d0/8/9c0ad52147ef3c81ff2aa5ade2e47.jpg 383w, https://blub/37/7/e2599bfe3c3e1ff8a6524ec7aecaa.jpg 240w" style="opacity: 1;">\n' +
                '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="slideshow lastbike cf sl 3" class="img-responsive" width="1199" height="799" sizes="(min-width: 1202px) 1199px, (min-width: 768px) 767px, 100vw" srcset="https://blub/1d/a/ee9f580d5a7091a38e1bd94dedc16.jpg 1199w, https://blub/22/6/63a3a2d9ad7ae01de933acac57efa.jpg 767w, https://blub/44/8/00aa4f2e62f4c23f7c0d9aeb1f2be.jpg 480w, https://blub/1b/6/70ece7ce62877aadba464080769e1.jpg 240w" style="opacity: 1;">\n';
            assert.deepEqual(parse({ type: 'normalOffer', data: input }), [expectedItem]);
        });

        it('is not confused by extra "small images" before the item', () => {
            const input =
                '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="Other Awesome Bike CF" class="img-responsive" width="1199" height="799" sizes="(min-width: 1202px) 599px, (min-width: 768px) 383px, 100vw" srcset="https://blub/75/5/307bfc1c636bdd639ed79f5013185.jpg 1199w, https://blub/d4/9/aa4f663dac3837dc54dafdc850467.jpg 767w, https://blub/80/a/0a21baa6d85d96e153fdedba7fc56.jpg 599w, https://blub/0d/b/800d6d729db7e6e3175f88a845af9.jpg 480w, https://blub/1a/e/f0a9c8667ee6f50a14a2c82c12a25.jpg 383w, https://blub/1a/1/fcab75e7326bc2ed51ad9203e830c.jpg 240w" style="opacity: 1;">\n' +
                exampleNormalItem;
            assert.deepEqual(parse({ type: 'normalOffer', data: input }), [expectedItem]);
        });

        it('is not confused by extra "small images" before and after the item', () => {
            const input =
                '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="Other Awesome Bike CF" class="img-responsive" width="1199" height="799" sizes="(min-width: 1202px) 599px, (min-width: 768px) 383px, 100vw" srcset="https://blub/75/5/307bfc1c636bdd639ed79f5013185.jpg 1199w, https://blub/d4/9/aa4f663dac3837dc54dafdc850467.jpg 767w, https://blub/80/a/0a21baa6d85d96e153fdedba7fc56.jpg 599w, https://blub/0d/b/800d6d729db7e6e3175f88a845af9.jpg 480w, https://blub/1a/e/f0a9c8667ee6f50a14a2c82c12a25.jpg 383w, https://blub/1a/1/fcab75e7326bc2ed51ad9203e830c.jpg 240w" style="opacity: 1;">\n' +
                exampleNormalItem +
                '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="road teaser sportprogeometrie" class="img-responsive" width="1199" height="799" sizes="(min-width: 1202px) 599px, (min-width: 768px) 383px, 100vw" srcset="https://blub/c4/a/b8ebdef98a8c93edd80c7da7e9ecd.jpg 1199w, https://blub/df/d/02dd72b2831c776f8f84c68246e0a.jpg 767w, https://blub/1c/5/02aa3d9921b2b6df3a62e6d36579b.jpg 599w, https://blub/9f/6/db09ec659cf4c615fb1bde7977057.jpg 480w, https://blub/d0/8/9c0ad52147ef3c81ff2aa5ade2e47.jpg 383w, https://blub/37/7/e2599bfe3c3e1ff8a6524ec7aecaa.jpg 240w" style="opacity: 1;">\n' +
                '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="slideshow lastbike cf sl 3" class="img-responsive" width="1199" height="799" sizes="(min-width: 1202px) 1199px, (min-width: 768px) 767px, 100vw" srcset="https://blub/1d/a/ee9f580d5a7091a38e1bd94dedc16.jpg 1199w, https://blub/22/6/63a3a2d9ad7ae01de933acac57efa.jpg 767w, https://blub/44/8/00aa4f2e62f4c23f7c0d9aeb1f2be.jpg 480w, https://blub/1b/6/70ece7ce62877aadba464080769e1.jpg 240w" style="opacity: 1;">\n';
            assert.deepEqual(parse({ type: 'normalOffer', data: input }), [expectedItem]);
        });
    });
});
