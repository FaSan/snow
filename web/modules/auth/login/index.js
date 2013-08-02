require('../../../vendor/shake')

var _ = require('lodash')
, debug = require('../../../util/debug')('login')
, template = require('./index.html')

module.exports = function(after) {
    var controller = {
        $el: $('<div class=auth-login>').html(template())
    }
    , $form = controller.$el.find('.login')
    , $email = $form.find('.form-group.email')
    , $password = $form.find('.form-group.password')
    , $submit = $form.find('button')
    , validatePasswordTimer
    , validateEmailTimer

    $email.add($password)
    .on('keyup', function(e) {
        if (e.which == 13 || e.which == 9) return

        // Revert to the original hint
        var group = $(this).closest('.form-group')
        group.removeClass('error warning success is-valid')
        .find('.help-inline')
        .empty()
    })

    if (after) {
        controller.$el.find('.new-user').attr('href', '#register?after=' + after)
    }

    function validateEmail() {
        var email = $email.find('input').val()
        , expression = /^\S+@\S+$/
        , $hint = $email.find('.help-inline')

        var valid = !!email.match(expression)

        if (email.length === 0 || valid) {
            $email.removeClass('error')
            if (valid) $email.addClass('success')
            $hint.empty()
        } else {
            $email.removeClass('success').addClass('error')
            $hint.empty()
        }

        $email.toggleClass('is-valid', valid)

        return valid
    }

    function validatePassword() {
        var password = $password.find('input').val()
        , $hint = $password.find('.help-inline')

        var valid = password.length >= 6

        if (password.length === 0 || valid) {
            $password.removeClass('error')
            if (valid) $password.addClass('success')
            $hint.empty()
        } else {
            $password.removeClass('success').addClass('error')
        }

        $password.toggleClass('is-valid', valid)

        return valid
    }

    $email.on('change keyup blur', 'input', function(e) {
        if (e.which == 9) return
        validateEmailTimer && clearTimeout(validateEmailTimer)
        validateEmailTimer = setTimeout(function() {
            validateEmail()
        }, 750)
    })

    $password.on('change keyup blur', 'input', function(e) {
        if (e.which == 9) return
        validatePasswordTimer && clearTimeout(validatePasswordTimer)
        validatePasswordTimer = setTimeout(function() {
            validatePassword()
        }, 750)
    })

    $form.on('submit', function(e) {
        e.preventDefault()

        validateEmail()
        validatePassword()

        var fields = [$email, $password]
        , invalid

        _.some(fields, function($e) {
            if ($e.hasClass('is-valid')) return
            $submit.shake()
            $e.find('input').focus()
            invalid = true
            return true
        })

        if (invalid) return

        $submit.prop('disabled', true)
        .addClass('is-loading')
        .html(i18n('login.login button.logging in'))

        debug('logging in')

        api.login($email.find('input').val(), $password.find('input').val())
        .always(function() {
            $submit.prop('disabled', false)
            .removeClass('is-loading')
            .html(i18n('login.login button'))
        }).done(function() {
            debug('login success')
            router.after(after)
        }).fail(function(err) {
            if (err !== null && err.name == 'UnknownApiKey') {
                $email
                .addClass('error')
                .find('.help-inline')
                .html(i18n('login.errors.wrong username or password'))
                return
            }

            errors.alertFromXhr(err)
        })
    })

    $email.find('input').focusSoon()

    return controller
}