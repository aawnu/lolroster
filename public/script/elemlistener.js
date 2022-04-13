const clickListener = function () {
    this.bindTeam = ''
    this.bindItem = ''
    this.bindType = ''

    this.hasSelectables = false
    this.hasChamps = false
    this.hasSpells = false

    this.getChamp = '/img/champ/%.png'
    this.getChampBanner = '/img/banner/%.png'
    this.getChampSpell = '/img/spell/%.png'

    this.search = null
    this.popCount = 0;
}

clickListener.prototype.pushAlert = function (text, duration = 3666, animation = 336) {
    this.popCount += 1;
    const cid = '' + this.popCount

    let container = (
        `<div class="container" data-cid="${cid}" style="display:none">${text}</div>`
    )

    $('aside.noticePopup').append(container)
    $(`aside.noticePopup > [data-cid="${cid}"]`)
        .slideDown(animation)

    setTimeout(() => {
        $(`aside.noticePopup > .container[data-cid="${cid}"]`)
            .fadeOut(animation * 0.66)
        setTimeout(() => {
            $(`aside.noticePopup > .container[data-cid="${cid}"]`).remove()
        }, animation)
    }, duration)

    return this
}

clickListener.prototype.clickChamp = function (elem = null) {
    if (
        this.bindType === null
        || this.bindTeam === null
        || this.bindItem === null
        || this.bindType != 'champ'
        || elem === null
    ) {
        this.pushAlert('Something went wrong, tried to select champ in the wrong state.')
        this.clickSelect()
        return
    }

    const setValue = $(elem).attr('data-champ')

    axios({
        method: 'POST',
        url: `/cache`,
        data: {
            team: this.bindTeam,
            slot: this.bindItem,
            value: setValue
        }
    }).then(() => {
        const refPath = `/cache/${this.bindTeam}/${this.bindItem}.png?${Date.now()}`
        const refElem = $(`[data-team="${this.bindTeam}"][data-item="${this.bindItem}"]`)
        setTimeout(() => {
            refElem.attr('src', refPath)
        }, 100);
    }).catch(err => {
        console.error(err)
    }).finally(() => {
        this.clickSelect()
    })
}

clickListener.prototype.clickSpell = function (elem = null) {
    if (
        this.bindType === null
        || this.bindTeam === null
        || this.bindItem === null
        || this.bindType != 'spell'
        || elem === null
    ) {
        this.pushAlert('Something went wrong, tried to select spell in the wrong state.')
        this.clickSelect()
        return
    }

    const setValue = $(elem).attr('data-spell')

    axios({
        method: 'POST',
        url: `/cache`,
        data: {
            team: this.bindTeam,
            slot: this.bindItem,
            value: setValue
        }
    }).then(() => {
        const refElem = $(`[data-team="${this.bindTeam}"][data-item="${this.bindItem}"]`)
        const refPath = `/cache/${this.bindTeam}/${this.bindItem}.png?${Date.now()}`
        setTimeout(() => {
            refElem.attr('src', refPath)
        }, 100);
    }).catch(err => {
        console.error(err)
    }).finally(() => {
        this.clickSelect()
    })
}

clickListener.prototype.clickSelect = function (elem = null) {
    const isSelected = elem?.hasClass('is-select')

    this.bindType = null
    this.bindTeam = null
    this.bindItem = null

    $('[data-select]').removeClass('is-select')

    if (!isSelected && elem !== null) {
        this.bindTeam = elem.attr('data-team')
        this.bindItem = elem.attr('data-item')
        elem.addClass('is-select')
        this.bindType = elem.attr('data-select')
    }

    if (this.bindType == 'champ') {
        $('.selection .champs').slideDown(300)
        $('.selection .spells').hide()
        $('html, body').animate({
            scrollTop: $("section.selection").offset().top
        }, 336);
        $('.selection .searchfor input').trigger('focus')
    } else if (this.bindType == 'spell') {
        $('.selection .spells').slideDown(300)
        $('.selection .champs').hide()
        $('html, body').animate({
            scrollTop: $("section.match").offset().top
        }, 336);
        $('.selection .searchfor input').trigger('focus')
    } else {
        $('.selection .spells').hide()
        $('.selection .champs').hide()
        $('html, body').animate({
            scrollTop: $("section.match").offset().top
        }, 336);
        $('.selection .searchfor input').val('')
        $(`.selection .champs .champ, .selection .spells .spell`).fadeIn(133)
    }
}

clickListener.prototype.loadSelectables = function () {
    if (this.hasSelectables) return this
    const self = this

    axios({
        method: 'GET',
        url: `/cache?${Date.now()}`
    }).then(res => {
        if (!res.data || typeof res.data != 'object') return
        self.hasSelectables = true

        for (const [team, teamData] of Object.entries(res.data)) {
            for (const [item, value] of Object.entries(teamData)) {
                $(`[data-team="${team}"][data-item="${item}"]`).each((idx, elem) => {
                    if (elem.tagName == 'IMG') {
                        elem.src = `/cache/${team}/${item}.png`
                    }

                    elem.classList.add('clickable')
                })
            }
        }

        $('[data-select]').on('click', function () {
            self.clickSelect($(this))
        })
    })

    axios({
        method: 'GET',
        url: `/lookup/names?${Date.now()}`
    }).then(res => {
        if (!res.data || typeof res.data != 'object') return
        self.hasSelectables = true

        for (const [field, value] of Object.entries(res.data)) {
            $(`[data-name="${field}"]`).each((idx, elem) => {
                if (elem.tagName == 'INPUT') {
                    elem.value = value
                } else if (elem.tagName != 'BUTTON') {
                    elem.innerText = value
                }

                elem.setAttribute('data-current', value)
            })
        }
    })

    return this
}

clickListener.prototype.loadChamps = function () {
    if (this.hasChamps) return this
    const self = this

    axios({
        method: 'GET',
        url: `/lookup/champs?${Date.now()}`
    }).then(res => {
        if (!res.data || typeof res.data != 'object') return
        self.hasChamps = true

        Object.values(res.data).forEach((champ, champNum) => {
            $('.selection .champs').append(
                `<div class="champ item clickable" data-champ="${champ}" data-search="${champ.toLowerCase()}">
                    <img class="icon" src="${this.getChamp.replace('%', champ)}" alt="${champ}" loading="lazy">
                    <span class="id">${champNum + 1}</span>
                    <span class="name">${champ}</span>
                </div>`
            )
        })

        $('.selection .champs').prepend(
            `<div class="champ item clickable" data-champ="" data-search="reset">
                <img class="icon" src="/default/champion.png" alt="Reset" loading="lazy">
                <span class="id">0</span>
                <span class="name">Reset</span>
            </div>`
        )

        $('[data-champ]').on('click', function () {
            self.clickChamp($(this))
        })
    })

    return this
}

clickListener.prototype.loadSpells = function () {
    if (this.hasSpells) return this
    const self = this

    axios({
        method: 'GET',
        url: `/lookup/spells?${Date.now()}`
    }).then(res => {
        if (!res.data || typeof res.data != 'object') return
        self.hasSpells = true

        Object.values(res.data).forEach((spell, spellNum) => {
            spellName = spell.replace('Summoner', '')
            $('.selection .spells').append(
                `<div class="spell item clickable" data-spell="${spell}" data-search="${spellName.toLowerCase()}">
                    <img class="icon" src="${this.getChampSpell.replace('%', spell)}" alt="${spellName}" loading="lazy">
                    <span class="id">${spellNum + 1}</span>
                    <span class="name">${spellName}</span>
                </div>`
            )
        })

        $('.selection .spells').prepend(
            `<div class="spell item clickable" data-spell="" data-search="reset">
                <img class="icon" src="/default/spell.png" alt="reset" loading="lazy">
                <span class="id">0</span>
                <span class="name">Reset</span>
            </div>`
        )

        $('[data-spell]').on('click', function () {
            self.clickSpell($(this))
        })
    })

    return this
}

clickListener.prototype.bindClickables = function () {
    const self = this
    $('button[data-swap]').on('click', function () {
        $('button[data-swap]').attr('disabled', true)
        axios({
            method: 'POST',
            url: '/action/swap'
        }).then(res => {
            setTimeout(() => {
                $('button[data-swap]').removeAttr('disabled')
            }, 400)
            if (!res?.data || typeof res?.data != 'object') return

            for (const [field, value] of Object.entries(res.data)) {
                $(`input[data-name="${field}"]`).each((idx, elem) => {
                    elem.value = value
                })
            }
        })
    })

    $('button[data-name]').on('click', function (event) {
        const elem = event.currentTarget
        const id = elem.getAttribute('data-name')
        const getValue = $(`input[data-name="${id}"]`).attr('data-current')
        const setValue = $(`input[data-name="${id}"]`).val()

        if (!setValue || setValue == getValue) {
            self.pushAlert("Name can't be the same or empty")
            return
        }

        axios({
            method: 'POST',
            url: `/action/name`,
            data: {
                slot: id,
                value: setValue
            }
        }).then(res => {
            $(`input[data-name="${id}"]`).val(res.data?.name)
            $(`input[data-name="${id}"]`).attr('data-current', setValue)
            self.pushAlert(`Changed ${id} from ${getValue} to ${setValue}`)
        })
    })

    $('button[data-reset]').on('click', function () {
        if (!confirm("Sure you want to reset all selected images?")) return
        $('button[data-reset]').attr('disabled', '')

        axios({
            method: 'POST',
            url: `/action/reset`,
        }).then(res => {
            if (!res?.data || typeof res.data != 'object') return

            let refreshTime = 100
            let refreshCount = 0

            for (const [team, teamData] of Object.entries(res.data)) {
                for (const [item, value] of Object.entries(teamData)) {
                    $(`[data-team="${team}"][data-item="${item}"]`).each((idx, elem) => {
                        if (elem.tagName == 'IMG') {
                            setTimeout(() => {
                                elem.src = `/cache/${team}/${item}.png?${Date.now()}`
                            }, refreshTime)
                            refreshCount += 1
                            if (refreshCount >= 6) {
                                refreshCount = 0
                                refreshTime += 100
                            }
                        } else if (elem.tagName == 'INPUT') {
                            elem.value = value
                        }
                    })
                }
            }
        }).catch(err => {
            const res = err.response
            self.pushAlert(res?.data?.message || 'Failed to reset')
        }).finally(() => {
            setTimeout(() => {
                $('button[data-reset]').removeAttr('disabled')
                self.pushAlert('Reset images')
            }, 1337)
        })
    })
    return this
}

clickListener.prototype.bindSearch = function () {
    const self = this

    $('.selection .searchfor input').on('input', (e) => {
        const me = $(e.currentTarget)
        clearTimeout(self.search)
        setTimeout(() => {
            const val = me.val().toLowerCase()
            if (val.length > 0) {
                $(`.selection .champs .champ:not([data-search*="${val}"]), .selection .spells .spell:not([data-search*="${val}"])`).fadeOut(222)
                $(`.selection .champs .champ[data-search*="${val}"], .selection .spells .spell[data-search*="${val}"]`).fadeIn(133)
            } else {
                $(`.selection .champs .champ, .selection .spells .spell`).fadeIn(133)
            }
            $('html, body').animate({
                scrollTop: $("section.selection").offset().top
            }, 336);
        }, 336)
    })

    return this
}