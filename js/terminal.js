// Cisco IOS terminal simulation engine (Part C)

(function () {
  'use strict';

  // Helper to escape HTML characters
  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[c];
    });
  }

  // Normalize command input and expected command strings
  function normalizeCommand(raw) {
    if (!raw) return '';
    var str = String(raw).trim().toLowerCase().replace(/\s+/g, ' ');

    // 1. Leverage window.Norm.ios if available from Part B
    if (typeof window !== 'undefined' && window.Norm && typeof window.Norm.ios === 'function') {
      try {
        var res = window.Norm.ios(str);
        if (res) {
          str = String(res).trim().toLowerCase().replace(/\s+/g, ' ');
        }
      } catch (e) {}
    }

    // 2. Built-in normalization & prefix expansion for the 12 supported commands
    if (/^en(a(b(le?)?)?)?$/.test(str)) {
      return 'enable';
    }
    if (/^dis(a(b(le?)?)?)?$/.test(str)) {
      return 'disable';
    }
    if (/^(conf|config|configure)(\s+t|\s+term|\s+terminal)?$/.test(str)) {
      return 'configure terminal';
    }
    if (/^ex(it)?$/.test(str)) {
      return 'exit';
    }
    if (str === 'end') {
      return 'end';
    }

    // hostname X
    var hostMatch = str.match(/^(?:host|hostname)\s+(\S+)$/i);
    if (hostMatch) {
      return 'hostname ' + hostMatch[1].toLowerCase();
    }

    // interface g0/0
    var intMatch = str.match(/^(?:int|interface)\s+(?:g|gi|gigabitethernet)?\s*(\d+\/\d+)$/i);
    if (intMatch) {
      return 'interface g' + intMatch[1];
    }

    // ip address A.B.C.D MASK
    var ipMatch = str.match(/^(?:ip\s+add|ip\s+address)\s+(\d{1,3}(?:\.\d{1,3}){3})\s+(\d{1,3}(?:\.\d{1,3}){3})$/i);
    if (ipMatch) {
      return 'ip address ' + ipMatch[1] + ' ' + ipMatch[2];
    }

    // no shutdown
    if (/^no\s+sh(ut(d(own)?)?)?$/.test(str)) {
      return 'no shutdown';
    }

    // show ip route
    if (/^(?:sh|show)\s+ip\s+ro(u(te?)?)?$/.test(str)) {
      return 'show ip route';
    }

    // show vlan brief
    if (/^(?:sh|show)\s+vl(an)?\s+br(i(ef?)?)?$/.test(str)) {
      return 'show vlan brief';
    }

    // show running-config
    if (/^(?:sh|show)\s+run(n(i(ng?-?config)?)?)?$/.test(str)) {
      return 'show running-config';
    }

    return str;
  }

  // Get active prompt string based on current mode and hostname
  function getPrompt(state) {
    var h = state.hostname || 'Router';
    switch (state.mode) {
      case 'priv':
        return h + '#';
      case 'config':
        return h + '(config)#';
      case 'config-if':
        return h + '(config-if)#';
      case 'user':
      default:
        return h + '>';
    }
  }

  // Command dispatcher: strictly supports the 12 specified commands
  function executeCommand(state, normCmd, rawCmd) {
    var mode = state.mode; // 'user' | 'priv' | 'config' | 'config-if'

    // 1. enable
    if (normCmd === 'enable') {
      if (mode === 'user') {
        state.mode = 'priv';
        return { valid: true, output: '' };
      }
      if (mode === 'priv') {
        return { valid: true, output: '' };
      }
      return { valid: false, output: "% Invalid input detected at '^' marker." };
    }

    // 2. disable
    if (normCmd === 'disable') {
      if (mode === 'priv') {
        state.mode = 'user';
        return { valid: true, output: '' };
      }
      return { valid: false, output: "% Invalid input detected at '^' marker." };
    }

    // 3. configure terminal
    if (normCmd === 'configure terminal') {
      if (mode === 'priv') {
        state.mode = 'config';
        return {
          valid: true,
          output: 'Enter configuration commands, one per line.  End with CNTL/Z.'
        };
      }
      return { valid: false, output: "% Invalid input detected at '^' marker." };
    }

    // 4. exit
    if (normCmd === 'exit') {
      if (mode === 'config-if') {
        state.mode = 'config';
        return { valid: true, output: '' };
      }
      if (mode === 'config') {
        state.mode = 'priv';
        return { valid: true, output: '%SYS-5-CONFIG_I: Configured from console by console' };
      }
      if (mode === 'priv') {
        state.mode = 'user';
        return { valid: true, output: '' };
      }
      if (mode === 'user') {
        return { valid: true, output: '' };
      }
    }

    // 5. end
    if (normCmd === 'end') {
      if (mode === 'config' || mode === 'config-if') {
        state.mode = 'priv';
        return { valid: true, output: '%SYS-5-CONFIG_I: Configured from console by console' };
      }
      return { valid: false, output: "% Invalid input detected at '^' marker." };
    }

    // 6. hostname X
    if (normCmd.indexOf('hostname ') === 0) {
      if (mode === 'config') {
        var parts = rawCmd.trim().split(/\s+/);
        var newName = parts[1] || 'Router';
        state.hostname = newName;
        return { valid: true, output: '' };
      }
      return { valid: false, output: "% Invalid input detected at '^' marker." };
    }

    // 7. interface g0/0
    if (normCmd === 'interface g0/0') {
      if (mode === 'config' || mode === 'config-if') {
        state.mode = 'config-if';
        return { valid: true, output: '' };
      }
      return { valid: false, output: "% Invalid input detected at '^' marker." };
    }

    // 8. ip address A.B.C.D MASK
    if (normCmd.indexOf('ip address ') === 0) {
      if (mode === 'config-if') {
        var ipParts = normCmd.split(' ');
        state.ip = ipParts[2] || '192.168.1.1';
        state.mask = ipParts[3] || '255.255.255.0';
        return { valid: true, output: '' };
      }
      return { valid: false, output: "% Invalid input detected at '^' marker." };
    }

    // 9. no shutdown
    if (normCmd === 'no shutdown') {
      if (mode === 'config-if') {
        state.shutdown = false;
        return {
          valid: true,
          output: '%LINK-5-CHANGED: Interface GigabitEthernet0/0, changed state to up\n%LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/0, changed state to up'
        };
      }
      return { valid: false, output: "% Invalid input detected at '^' marker." };
    }

    // 10. show ip route
    if (normCmd === 'show ip route') {
      if (mode === 'priv' || mode === 'user') {
        return {
          valid: true,
          output: [
            'Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP',
            '       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area',
            '',
            'Gateway of last resort is not set',
            '',
            '      192.168.1.0/24 is variably subnetted, 2 subnets, 2 masks',
            'C        192.168.1.0/24 is directly connected, GigabitEthernet0/0',
            'L        192.168.1.1/32 is directly connected, GigabitEthernet0/0'
          ].join('\n')
        };
      }
      return { valid: false, output: "% Invalid input detected at '^' marker." };
    }

    // 11. show vlan brief
    if (normCmd === 'show vlan brief') {
      if (mode === 'priv' || mode === 'user') {
        return {
          valid: true,
          output: [
            'VLAN Name                             Status    Ports',
            '---- -------------------------------- --------- -------------------------------',
            '1    default                          active    Gi0/1, Gi0/2, Gi0/3',
            '1002 fddi-default                     act/unsup',
            '1003 token-ring-default               act/unsup',
            '1004 fddinet-default                  act/unsup',
            '1005 trnet-default                    act/unsup'
          ].join('\n')
        };
      }
      return { valid: false, output: "% Invalid input detected at '^' marker." };
    }

    // 12. show running-config
    if (normCmd === 'show running-config') {
      if (mode === 'priv') {
        var hName = state.hostname || 'Router';
        var ipLine = state.ip ? ' ip address ' + state.ip + ' ' + state.mask : ' no ip address';
        var shutLine = state.shutdown ? ' shutdown' : ' no shutdown';
        return {
          valid: true,
          output: [
            'Building configuration...',
            '',
            'Current configuration : 1024 bytes',
            '!',
            'version 15.2',
            'hostname ' + hName,
            '!',
            'interface GigabitEthernet0/0',
            ipLine,
            shutLine,
            ' duplex auto',
            ' speed auto',
            '!',
            'end'
          ].join('\n')
        };
      }
      return { valid: false, output: "% Invalid input detected at '^' marker." };
    }

    // Default: anything else prints Cisco standard invalid input error
    return { valid: false, output: "% Invalid input detected at '^' marker." };
  }

  // Register 'terminal' QuestionType conforming to CONTRACT.md
  if (typeof window !== 'undefined' && window.QuestionTypes && typeof window.QuestionTypes.register === 'function') {
    window.QuestionTypes.register('terminal', {
      render: function (q, ctx) {
        var qKey = ctx.qId !== undefined ? ctx.qId : ctx.qIndex;
        var rKey = ctx.room ? ctx.room.id : 'r';
        var termId = 'term-' + rKey + '-' + qKey;
        var solvedBadge = ctx.solved ? '<span class="term-badge">✓ Solved</span>' : '';

        return [
          '<div id="' + escapeHtml(termId) + '" class="term-container">',
          '  <div class="term-header">',
          '    <div class="term-title-group">',
          '      <span class="term-dots">',
          '        <i class="term-dot red"></i>',
          '        <i class="term-dot yellow"></i>',
          '        <i class="term-dot green"></i>',
          '      </span>',
          '      <span class="term-title">Cisco IOS Simulator</span>',
          '      ' + solvedBadge,
          '    </div>',
          '    <button type="button" class="term-btn-reset" id="' + escapeHtml(termId) + '-reset">Reset terminal</button>',
          '  </div>',
          '  <div class="term-body" id="' + escapeHtml(termId) + '-body">',
          '    <div class="term-output" id="' + escapeHtml(termId) + '-output"></div>',
          '    <div class="term-input-row" id="' + escapeHtml(termId) + '-input-row">',
          '      <span class="term-prompt-label" id="' + escapeHtml(termId) + '-prompt">Router&gt;</span>',
          '      <input type="text" class="term-input" id="' + escapeHtml(termId) + '-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Terminal command input">',
          '    </div>',
          '  </div>',
          '</div>'
        ].join('\n');
      },

      mount: function (root, q, ctx) {
        if (!root) return;
        var qKey = ctx.qId !== undefined ? ctx.qId : ctx.qIndex;
        var rKey = ctx.room ? ctx.room.id : 'r';
        var termId = 'term-' + rKey + '-' + qKey;

        var container = root.querySelector('#' + termId);
        if (!container) return;

        var outEl = root.querySelector('#' + termId + '-output');
        var promptEl = root.querySelector('#' + termId + '-prompt');
        var inputEl = root.querySelector('#' + termId + '-input');
        var resetBtn = root.querySelector('#' + termId + '-reset');

        if (!inputEl || !promptEl || !outEl) return;

        // Fresh state per task instance (never shared across tasks)
        var state = {
          hostname: 'Router',
          mode: 'user', // 'user' | 'priv' | 'config' | 'config-if'
          ip: null,
          mask: null,
          shutdown: true,
          expectIndex: 0,
          history: [],
          historyIndex: -1
        };

        // Appends safely escaped command and output lines
        function appendLine(promptText, cmdText, outputText, isError) {
          var lineEl = document.createElement('div');
          lineEl.className = 'term-line';

          var pSpan = document.createElement('span');
          pSpan.className = 'term-line-prompt';
          pSpan.textContent = promptText;

          lineEl.appendChild(pSpan);

          if (cmdText) {
            var cSpan = document.createElement('span');
            cSpan.className = 'term-line-cmd';
            cSpan.textContent = cmdText;
            lineEl.appendChild(document.createTextNode(' '));
            lineEl.appendChild(cSpan);
          }
          outEl.appendChild(lineEl);

          if (outputText) {
            var lines = outputText.split('\n');
            lines.forEach(function (l) {
              var outDiv = document.createElement('div');
              outDiv.className = isError ? 'term-line-err' : 'term-line-out';
              outDiv.textContent = l;
              outEl.appendChild(outDiv);
            });
          }

          outEl.scrollTop = outEl.scrollHeight;
        }

        // Submits active command from input
        function submitCommand() {
          var raw = inputEl.value;
          var trimmed = raw.trim();
          var currentPrompt = getPrompt(state);

          if (trimmed) {
            state.history.push(raw);
            state.historyIndex = state.history.length;
          }

          inputEl.value = '';

          // Blank line submission reprompts
          if (!trimmed) {
            appendLine(currentPrompt, '', '', false);
            return;
          }

          var normCmd = normalizeCommand(trimmed);
          var result = executeCommand(state, normCmd, trimmed);

          appendLine(currentPrompt, raw, result.output, !result.valid);
          promptEl.textContent = getPrompt(state);

          // Validate progression against q.expect
          var expectList = Array.isArray(q.expect) ? q.expect : [];
          if (result.valid && !ctx.solved && state.expectIndex < expectList.length) {
            var nextExpectedNorm = normalizeCommand(expectList[state.expectIndex]);
            if (normCmd === nextExpectedNorm) {
              state.expectIndex++;
              if (state.expectIndex >= expectList.length) {
                if (typeof ctx.solve === 'function') {
                  ctx.solve();
                }
              }
            }
          }
        }

        // Keyboard listener for Enter and Up/Down command history
        inputEl.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            submitCommand();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (state.history.length > 0) {
              if (state.historyIndex === -1 || state.historyIndex >= state.history.length) {
                state.historyIndex = state.history.length - 1;
              } else if (state.historyIndex > 0) {
                state.historyIndex--;
              }
              inputEl.value = state.history[state.historyIndex] || '';
              setTimeout(function () {
                inputEl.selectionStart = inputEl.selectionEnd = inputEl.value.length;
              }, 0);
            }
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (state.history.length > 0) {
              if (state.historyIndex >= 0 && state.historyIndex < state.history.length - 1) {
                state.historyIndex++;
                inputEl.value = state.history[state.historyIndex] || '';
              } else {
                state.historyIndex = state.history.length;
                inputEl.value = '';
              }
              setTimeout(function () {
                inputEl.selectionStart = inputEl.selectionEnd = inputEl.value.length;
              }, 0);
            }
          }
        });

        // Reset terminal button handler
        if (resetBtn) {
          resetBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            state.hostname = 'Router';
            state.mode = 'user';
            state.ip = null;
            state.mask = null;
            state.shutdown = true;
            state.expectIndex = 0;
            state.historyIndex = -1;
            outEl.innerHTML = '';
            promptEl.textContent = getPrompt(state);
            inputEl.value = '';
            inputEl.focus();
          });
        }

        // Click on terminal body focuses the input line
        container.addEventListener('click', function (e) {
          if (!e.target.closest('.term-btn-reset') && inputEl) {
            inputEl.focus();
          }
        });

        // Auto-focus on mount
        setTimeout(function () {
          if (inputEl) {
            inputEl.focus();
          }
        }, 50);
      }
    });
  }
})();
