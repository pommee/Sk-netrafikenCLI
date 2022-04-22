# Skånetrafiken CLI

CLI based application for fast viewing of soon leaving trains.
<p align="center">
  <img src="./img/showcase.gif" alt="Size Limit CLI" width="738">
</p>

### Running the application

Look at the table to get required flags, some are just optional.<br>
**node main -f <"from"> -t <"to">** is the basic command.

| Flag | Comment                                                                             | Required |
|------|-------------------------------------------------------------------------------------|----------|
| -f   | Where you are traveling **from**. ``-f Stockholm`` for example                      | ✅        |
| -t   | The final destination that you wish to travel **to**. ``-t Göteborg`` for example   | ✅        |
| -hf  | **Headless False** - Browser will run in headless mode. ``This is true by default`` | ❌        |
