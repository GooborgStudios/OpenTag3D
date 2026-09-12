<!-- prettier-ignore-start -->
```json
{
{%- for field in site.data.spec.web_api.fields %}
  "{{ field.id }}": {% if field.id == "opentag_version" %}"{{ site.data.spec.version }}"
  {%- elsif field.type == "string" %}"{{ field.examples.first }}"
  {%- elsif field.type == "bool" %}{{ field.examples.first }}
  {%- elsif field.type == "object" %}{
    {%- assign obj = field.examples.first -%}
    {%- for pair in obj %}
    "{{ pair[0] }}": {% if pair[1].first %}[
      {%- for item in pair[1] %}
      "{{ item }}"{% unless forloop.last %},{% endunless %}
      {%- endfor %}
    ]{% else %}"{{ pair[1] }}"{% endif %}{% unless forloop.last %},{% endunless %}
    {%- endfor %}
  }
  {%- else %}{{ field.examples.first | jsonify }}
  {%- endif %}{% unless forloop.last %},{% endunless %}
{%- endfor %}
}
```
<!-- prettier-ignore-end -->
