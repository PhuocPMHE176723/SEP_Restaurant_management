using Microsoft.AspNetCore.Mvc;
using rmn_be.Models;

namespace rmn_be.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RmnController : ControllerBase
{
    private static readonly List<RmnItem> Items =
    [
        new(
            Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            "Demo record",
            "Sample description to validate the pipeline"
        ),
        new(
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            "Second record",
            "Useful for FE integration tests"
        ),
    ];

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult<IEnumerable<RmnItem>> GetAll() => Ok(Items);

    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<RmnItem> GetById(Guid id)
    {
        var item = Items.FirstOrDefault(x => x.Id == id);
        return item is null ? NotFound() : Ok(item);
    }
}
